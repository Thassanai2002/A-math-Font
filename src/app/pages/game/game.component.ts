import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GameService, GameState, Placement } from '../../services/game.service';
import { SignalRService } from '../../services/signalr.service';

interface PendingPlacement {
  row: number;
  col: number;
  tile: string;
  source: string;
  rackIndex: number;
}

interface FlexChoice {
  row: number;
  col: number;
  rackIndex: number;
  tile: string;
}

interface CellView {
  tile: string | null;
  premium: string | null;
  status: 'empty' | 'board' | 'pending' | 'moving';
}

const GLYPH: Record<string, string> = { '*': '×', '/': '÷', '+-': '±', '*/': '×/÷' };

@Component({
  selector: 'app-game',
  imports: [],
  template: `
    <div class="wrap">
      <h1>A-MATH</h1>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      @if (state) {
        <p class="room">Room: {{ state.roomCode }}</p>

        @if (waiting) {
          <div class="card center">
            <p class="room-code">Room Code: <strong>{{ state.roomCode }}</strong></p>
            <button (click)="copyCode()">{{ copied ? 'คัดลอกแล้ว!' : 'คัดลอก Code' }}</button>

            @for (p of state.players; track p.playerNumber) {
              <p>Player {{ p.playerNumber }}: {{ p.username }}</p>
            }

            <p class="waiting">Waiting for Player 2...</p>
          </div>
        } @else {
          <div class="card">
            @for (p of state.players; track p.playerNumber) {
              <p>
                Player {{ p.playerNumber }}: {{ p.username }} — Score: <strong>{{ p.score }}</strong>
                @if (p.playerNumber === yourPlayerNumber) { (คุณ) }
              </p>
            }
            <p class="turn" [class.my-turn]="isMyTurn()">
              Turn: Player {{ state.currentTurn }} @if (isMyTurn()) { (คุณ) } @else { (รอฝ่ายตรงข้าม...) }
            </p>
            <p class="info">ถุง: {{ state.bagCount }} ตัว | ฝ่ายตรงข้ามเหลือ: {{ state.opponentTileCount }} ตัว</p>

            <div class="board">
              @for (row of view; track $index; let r = $index) {
                <div class="board-row">
                  @for (cell of row; track $index; let c = $index) {
                    <div
                      class="cell {{ cellClass(cell.premium) }} {{ cell.status }}"
                      (click)="onCellClick(r, c)"
                    >
                      @if (cell.tile) {
                        <span class="chip">{{ display(cell.tile) }}</span>
                      } @else if (cell.premium === 'CENT') {
                        <span class="star">★</span>
                      } @else {
                        <span class="lbl">{{ premiumLabel(cell.premium) }}</span>
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <div class="legend">
              <span class="lg b3E">แดง = สมการ ×3</span>
              <span class="lg b3P">ฟ้า = ตัว ×3</span>
              <span class="lg b2P">ส้ม = ตัว ×2</span>
              <span class="lg star">★ = จุดเริ่ม</span>
            </div>

            <p class="rack">
              @if (reorderMode) {
                <span class="hint">จัดเรียง: คลิก 2 เบี้ยเพื่อสลับตำแหน่งกัน</span>
              } @else if (exchangeMode) {
                <span class="hint">คลิกเบี้ยเพื่อเลือกแลก ({{ exchangeSelected.size }} ตัว)</span>
              } @else {
                <span class="hint">วาง: คลิกเบี้ยในมือ แล้วคลิกช่อง / ย้าย: คลิกเบี้ยบนกระดานแล้วคลิกช่องใหม่</span>
              }
            </p>
            <div class="rack {{ reorderMode ? '' : (isMyTurn() ? '' : 'disabled') }}">
              @for (pos of rackOrder; track $index) {
                <div
                  class="rack-tile {{ rackClass(pos) }}"
                  (click)="onRackClick(pos)"
                >
                  {{ display(rackTile(pos)) }}
                </div>
              }
            </div>

            @if (message) {
              <p class="msg">{{ message }}</p>
            }

            <div class="actions">
              <button class="primary" (click)="confirmPlace()" [disabled]="!canConfirm()">Confirm วาง</button>
              <button (click)="confirmPass()" [disabled]="!isMyTurn()">Pass</button>
              <button (click)="toggleReorder()" [disabled]="!state" class="{{ reorderMode ? 'active' : '' }}">จัดเรียง</button>
              <button (click)="toggleExchange()" [disabled]="!isMyTurn()" class="{{ exchangeMode ? 'active' : '' }}">Exchange แลก</button>
              <button (click)="clearPending()" [disabled]="pending.length === 0">ยกเลิกการวาง</button>
            </div>
          </div>
        }
      } @else {
        <p>กำลังโหลด...</p>
      }
    </div>

    @if (flexChoice) {
      <div class="overlay" (click)="flexChoice = null">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>เลือกค่าของเบี้ย {{ display(flexChoice.tile) }}</h3>
          @if (flexChoice.tile === '?') {
            <div class="flex-grid">
              @for (opt of blankOptions; track opt) {
                <button (click)="flexChoose(opt)">{{ display(opt) }}</button>
              }
            </div>
          } @else {
            @for (opt of flexOptions; track opt) {
              <button class="big" (click)="flexChoose(opt)">{{ display(opt) }}</button>
            }
          }
        </div>
      </div>
    }

    @if (gameOver) {
      <div class="overlay">
        <div class="modal center">
          <h2>จบเกม!</h2>
          <p class="winner">{{ gameOverText }}</p>
          @for (p of state?.players ?? []; track p.playerNumber) {
            <p>Player {{ p.playerNumber }} ({{ p.username }}): {{ p.score }} แต้ม</p>
          }
          <button class="primary" (click)="backToLobby()">กลับสู่ Lobby</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .wrap { max-width: 720px; margin: 20px auto; padding: 0 12px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    h1 { text-align: center; letter-spacing: 3px; margin: 6px 0; }
    h1, .room { text-align: center; }
    .room { margin: 4px 0 8px; }
    .room-code { font-size: 20px; }
    .waiting { color: #666; font-style: italic; }
    .error { color: #d32f2f; text-align: center; }
    .center { text-align: center; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px 14px; background: #fff; margin-top: 8px; }
    .turn { font-weight: 600; }
    .turn.my-turn { color: #2e7d32; }
    .info { color: #666; font-size: 13px; }
    .board { display: inline-grid; grid-template-rows: repeat(15, 32px); border: 1px solid #999; background: #f5f0e1; }
    .board-row { display: grid; grid-template-columns: repeat(15, 32px); }
    .cell {
      width: 32px; min-width: 32px; max-width: 32px;
      height: 32px; min-height: 32px; max-height: 32px;
      border: 0.5px solid #d8d2c0; box-sizing: border-box; overflow: hidden;
      display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600;
      line-height: 1; padding: 0;
      cursor: default; background: #f5f0e1;
    }
    .cell .chip {
      width: 28px; height: 28px; box-sizing: border-box;
      display: flex; align-items: center; justify-content: center;
      line-height: 1; overflow: hidden;
      background: #fff; border: 1px solid #9e9e9e; border-radius: 3px;
    }
    .cell .lbl, .cell .star { display: block; line-height: 1; }
    .cell.board { background: #fffde7; }
    .cell.b3E.empty { background: #e53935; color: #fff; }
    .cell.b3P.empty { background: #1e88e5; color: #fff; }
    .cell.b2P.empty { background: #fb8c00; color: #fff; }
    .cell.bCENT.empty { background: #1976d2; }
    .cell.pending { background: #a5d6a7; box-shadow: inset 0 0 0 2px #2e7d32; cursor: pointer; }
    .cell.moving { outline: 2px dashed #1565c0; outline-offset: -3px; }
    .cell:not(.board):not(.pending) { cursor: pointer; }
    span.star { color: #fff; }
    .legend { font-size: 11px; margin: 4px 0; color: #555; }
    .legend .lg { margin-right: 10px; }
    .rack { margin-top: 6px; }
    .hint { font-size: 12px; color: #666; }
    .rack-tile {
      display: inline-flex; width: 40px; height: 40px; margin: 2px; align-items: center; justify-content: center;
      border: 2px solid #1976d2; border-radius: 6px; font-size: 18px; font-weight: 700;
      background: #fff; cursor: pointer; user-select: none;
    }
    .rack.disabled .rack-tile { border-color: #bbb; color: #999; cursor: not-allowed; }
    .rack-tile.selected { border-color: #2e7d32; background: #c8e6c9; box-shadow: 0 0 0 2px #2e7d32; }
    .rack-tile.used { opacity: 0.35; box-shadow: inset 0 0 0 3px #bdbdbd; cursor: not-allowed; }
    .rack-tile.exch { border-color: #e53935; background: #ffcdd2; box-shadow: 0 0 0 2px #e53935; }
    .rack-tile.reorder-sel { border-color: #6a1b9a; background: #e1bee7; box-shadow: 0 0 0 2px #6a1b9a; }
    .actions { margin-top: 10px; }
    button { padding: 9px 14px; margin: 3px 6px 3px 0; background: #1976d2; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    button.primary { background: #2e7d32; }
    button.active { background: #e53935; }
    .msg { color: #1b5e20; background: #e8f5e9; border-radius: 4px; padding: 6px 10px; margin: 6px 0 0; font-size: 14px; }
    .overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal { background: #fff; border-radius: 10px; padding: 18px 22px; max-width: 460px; }
    .modal h3 { margin-top: 0; }
    .flex-grid { display: grid; grid-template-columns: repeat(8, 44px); gap: 8px; }
    .flex-grid button { font-size: 16px; font-weight: 700; margin: 0; padding: 10px 0; }
    .modal button.big { font-size: 26px; padding: 12px 34px; margin: 6px; }
    .modal.center { text-align: center; }
    .winner { font-size: 18px; font-weight: 700; color: #2e7d32; }
  `],
})
export class GameComponent implements OnInit, OnDestroy {
  state: GameState | null = null;
  waiting = true;
  yourPlayerNumber = 0;
  copied = false;
  error = '';
  message = '';
  gameOver = false;
  gameOverText = '';

  gameId = '';
  username = '';

  view: CellView[][] = [];

  selectedRackIndex = -1;
  pending: PendingPlacement[] = [];
  pendingSelIndex = -1;
  flexChoice: FlexChoice | null = null;

  exchangeMode = false;
  exchangeSelected = new Set<number>();
  reorderMode = false;
  reorderPick: number | null = null;
  rackOrder: number[] = [];

  blankOptions = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '+', '-', '*', '/', '='];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private game: GameService,
    private signalr: SignalRService,
  ) {}

  get flexOptions(): string[] {
    if (!this.flexChoice) {
      return [];
    }

    return this.flexChoice.tile === '+-' ? ['+', '-'] : ['*', '/'];
  }

  async ngOnInit(): Promise<void> {
    this.gameId = this.route.snapshot.paramMap.get('gameId') ?? '';
    this.username = this.auth.getUsername();
    if (!this.gameId || !this.username) {
      this.error = 'ข้อมูลเกมไม่ถูกต้อง';
      return;
    }

    this.loadState();

    this.signalr.on('GameStarted', (s: GameState) => this.setState(s));
    this.signalr.on('PlayerJoined', (e: { status?: string; playerCount?: number }) => {
      if (e?.status === 'Playing' && e?.playerCount === 2) {
        this.loadState();
      }
    });
    this.signalr.on('StateChanged', () => this.loadState());

    try {
      await this.signalr.connect();
      this.signalr.joinGame(this.gameId);
    } catch {
      this.error = 'เชื่อมต่อสัญญาณแบบเรียลไทม์ไม่สำเร็จ';
    }
  }

  ngOnDestroy(): void {
    this.signalr.leaveGame(this.gameId);
  }

  loadState(): void {
    this.game.getGame(this.gameId, this.username).subscribe({
      next: (s) => this.setState(s),
      error: (err) => (this.error = err.error?.message ?? 'โหลดเกมไม่สำเร็จ'),
    });
  }

  setState(s: GameState): void {
    this.state = s;
    this.yourPlayerNumber = s.yourPlayerNumber;
    this.waiting = s.status === 'Waiting';
    this.gameOver = s.status === 'Finished';
    this.pending = [];
    this.selectedRackIndex = -1;
    this.pendingSelIndex = -1;
    this.exchangeMode = false;
    this.exchangeSelected.clear();
    this.reorderMode = false;
    this.reorderPick = null;
    this.rackOrder = s.yourRack.map((_, i) => i);
    this.buildView();

    if (this.gameOver) {
      const players = [...s.players].sort((a, b) => b.score - a.score);
      const top = players[0];
      const tied = players.length > 1 && players[1]?.score === top?.score;
      this.gameOverText = tied
        ? `เกมเสมอกันที่ ${top?.score} แต้ม`
        : `ผู้ชนะ: Player ${top?.playerNumber} (${top?.username}) — ${top?.score} แต้ม`;
    }
  }

  buildView(): void {
    const board = this.state?.board ?? [];
    const premium = this.state?.premium ?? [];
    const statusMap = new Map<string, string>();
    for (const p of this.pending) {
      statusMap.set(`${p.row},${p.col}`, p.tile);
    }

    this.view = [];
    for (let r = 0; r < 15; r++) {
      const row: CellView[] = [];
      for (let c = 0; c < 15; c++) {
        const pendingTile = statusMap.get(`${r},${c}`);
        const tile = (board[r]?.[c] as string | null) ?? null;
        if (pendingTile) {
          row.push({
            tile: pendingTile,
            premium: premium[r]?.[c] ?? null,
            status: this.pendingSelIndex >= 0 && this.pending.find((p) => p.row === r && p.col === c)?.rackIndex === this.pendingSelIndex ? 'moving' : 'pending',
          });
        } else if (tile) {
          row.push({ tile, premium: premium[r]?.[c] ?? null, status: 'board' });
        } else {
          row.push({ tile: null, premium: premium[r]?.[c] ?? null, status: 'empty' });
        }
      }

      this.view.push(row);
    }
  }

  display(tile: string): string {
    return GLYPH[tile] ?? tile;
  }

  cellClass(code: string | null): string {
    if (code === '3E') { return 'b3E'; }
    if (code === '3P') { return 'b3P'; }
    if (code === '2P') { return 'b2P'; }
    if (code === 'CENT') { return 'bCENT'; }
    return '';
  }

  premiumLabel(code: string | null): string {
    if (!code) {
      return '';
    }

    return code === '2P' ? '2X' : '3X';
  }

  isMyTurn(): boolean {
    return !!this.state && this.state.isYourTurn;
  }

  usedRackIndices(): Set<number> {
    return new Set(this.pending.map((p) => p.rackIndex));
  }

  rackTile(index: number): string {
    return this.state?.yourRack[index] ?? '';
  }

  toggleReorder(): void {
    this.reorderMode = !this.reorderMode;
    this.reorderPick = null;
    if (this.reorderMode) {
      this.exchangeMode = false;
      this.selectedRackIndex = -1;
    }
  }

  rackClass(index: number): string {
    if (this.reorderMode) {
      return this.reorderPick === index ? 'reorder-sel' : '';
    }

    if (this.exchangeMode) {
      return this.exchangeSelected.has(index) ? 'exch' : '';
    }

    const used = this.usedRackIndices();
    if (used.has(index)) {
      return 'used';
    }

    return index === this.selectedRackIndex ? 'selected' : '';
  }

  onRackClick(index: number): void {
    if (this.reorderMode) {
      if (this.reorderPick === index) {
        this.reorderPick = null;
        return;
      }

      if (this.reorderPick !== null) {
        const a = this.reorderPick;
        const b = index;
        const order = [...this.rackOrder];
        const ai = order.indexOf(a);
        const bi = order.indexOf(b);
        if (ai >= 0 && bi >= 0) {
          [order[ai], order[bi]] = [order[bi], order[ai]];
        }
        this.rackOrder = order;
        this.reorderPick = null;
      } else {
        this.reorderPick = index;
      }

      return;
    }

    if (!this.isMyTurn() || !this.state) {
      return;
    }

    if (this.exchangeMode) {
      if (this.exchangeSelected.has(index)) {
        this.exchangeSelected.delete(index);
      } else {
        this.exchangeSelected.add(index);
      }

      return;
    }

    if (this.usedRackIndices().has(index)) {
      return;
    }

    this.pendingSelIndex = -1;
    this.selectedRackIndex = this.selectedRackIndex === index ? -1 : index;
  }

  onCellClick(r: number, c: number): void {
    if (!this.isMyTurn() || this.exchangeMode || !this.state) {
      return;
    }

    const existing = this.pending.find((p) => p.row === r && p.col === c);
    if (existing) {
      this.pendingSelIndex = this.pendingSelIndex === existing.rackIndex ? -1 : existing.rackIndex;
      this.selectedRackIndex = -1;
      this.buildView();
      return;
    }

    if (this.state.board[r]?.[c]) {
      return;
    }

    const moving = this.pending.find((p) => p.rackIndex === this.pendingSelIndex);
    if (moving) {
      moving.row = r;
      moving.col = c;
      this.selectedRackIndex = -1;
      this.buildView();
      return;
    }

    if (this.selectedRackIndex < 0) {
      return;
    }

    const tile = this.state.yourRack[this.selectedRackIndex];
    if (!tile) {
      return;
    }

    if (tile === '+-' || tile === '*/' || tile === '?') {
      this.flexChoice = { row: r, col: c, rackIndex: this.selectedRackIndex, tile };
    } else {
      this.addPlacement(r, c, tile, tile, this.selectedRackIndex);
    }
  }

  addPlacement(row: number, col: number, tile: string, source: string, rackIndex: number): void {
    this.pending.push({ row, col, tile, source, rackIndex });
    this.selectedRackIndex = -1;
    this.pendingSelIndex = -1;
    this.flexChoice = null;
    this.buildView();
  }

  flexChoose(resolved: string): void {
    const f = this.flexChoice;
    if (!f) {
      return;
    }

    this.addPlacement(f.row, f.col, resolved, f.tile, f.rackIndex);
  }

  canConfirm(): boolean {
    return this.isMyTurn() && this.pending.length > 0;
  }

  clearPending(): void {
    this.pending = [];
    this.selectedRackIndex = -1;
    this.pendingSelIndex = -1;
    this.buildView();
  }

  confirmPlace(): void {
    if (!this.canConfirm()) {
      return;
    }

    const placements: Placement[] = this.pending.map((p) => ({ row: p.row, col: p.col, tile: p.tile, source: p.source }));
    this.game.place(this.gameId, this.username, placements).subscribe({
      next: (r) => {
        this.message = r.message + (r.endMessage ? ' — ' + r.endMessage : '');
        if (r.state) {
          this.setState(r.state);
        } else {
          this.loadState();
        }
      },
      error: (err) => {
        this.error = err.error?.message ?? 'วางไม่ได้';
        setTimeout(() => (this.error = ''), 4000);
      },
    });
  }

  confirmPass(): void {
    if (!this.isMyTurn()) {
      return;
    }

    this.game.pass(this.gameId, this.username).subscribe({
      next: (r) => {
        this.message = r.endMessage || 'คุณเลือกผ่านเทิร์น';
        if (r.state) {
          this.setState(r.state);
        } else {
          this.loadState();
        }
      },
      error: (err) => {
        this.error = err.error?.message ?? 'ผ่านไม่ได้';
        setTimeout(() => (this.error = ''), 4000);
      },
    });
  }

  toggleExchange(): void {
    if (!this.isMyTurn()) {
      return;
    }

    if (this.exchangeMode) {
      this.doExchange();
      return;
    }

    this.exchangeMode = true;
    this.exchangeSelected.clear();
    this.reorderMode = false;
    this.reorderPick = null;
    this.message = 'คลิกเบี้ยที่จะแลก จากนั้นกด Exchange เพื่อยืนยัน';
  }

  doExchange(): void {
    const indices = [...this.exchangeSelected].map((i) => this.state?.yourRack[i]).filter((t): t is string => !!t);
    if (indices.length === 0) {
      this.error = 'กรุณาเลือกเบี้ยที่จะแลกก่อน';
      return;
    }

    this.game.exchange(this.gameId, this.username, indices).subscribe({
      next: (r) => {
        this.message = r.message ?? 'แลกเบี้ยสำเร็จ';
        this.exchangeMode = false;
        this.exchangeSelected.clear();
        if (r.state) {
          this.setState(r.state);
        } else {
          this.loadState();
        }
      },
      error: (err) => {
        this.error = err.error?.message ?? 'แลกเบี้ยไม่ได้';
        setTimeout(() => (this.error = ''), 4000);
      },
    });
  }

  backToLobby(): void {
    this.router.navigate(['/lobby']);
  }

  async copyCode(): Promise<void> {
    if (!this.state) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.state.roomCode);
      this.copied = true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = this.state.roomCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.copied = true;
    }

    setTimeout(() => (this.copied = false), 2000);
  }
}