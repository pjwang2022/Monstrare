/**
 * 治理看板 — 零依賴本地 server
 *
 * 啟動：node tools/kanban/server.mjs（或 npm run kanban）
 * 資料：tools/kanban/cards/*.json（一檔一卡，git tracked）
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const HOST = '127.0.0.1';
const PORT = 4420;

const ROOT = import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname);
const CARDS_DIR = path.join(ROOT, 'cards');
const INDEX_HTML = path.join(ROOT, 'index.html');
const EPICS_JSON = path.join(ROOT, 'epics.json');

fs.mkdirSync(CARDS_DIR, { recursive: true });

const ID_PREFIX = 'BOOK';
const ID_RE = new RegExp('^' + ID_PREFIX + '-\\d{3,}$');
const STAGES = ['backlog', 'blocked', 'ready', 'implementing', 'verify', 'done'];
const RISKS = ['low', 'medium', 'high'];
const TRACKS = ['frontend', 'backend', 'integration', 'n/a'];
const READINESS_KEYS = [
  'problem_clear', 'non_goals_clear', 'acceptance_testable', 'files_known',
  'scope_defined', 'verification_contract', 'human_approval_recorded'
];
const GATE_KEYS = ['product', 'ui', 'architecture', 'security', 'test', 'code_review'];
const LINK_KEYS = ['featureSpec', 'screenSpec', 'mockupDecision', 'taskCard', 'verificationReport', 'pr'];

/* ── helpers ── */

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function validateCard(c) {
  if (!isPlainObject(c)) return 'card 必須是 object';
  if (typeof c.id !== 'string' || !ID_RE.test(c.id)) return 'id 必須符合 ^' + ID_PREFIX + '-\\d{3,}$';
  if (typeof c.title !== 'string' || c.title.trim() === '') return 'title 必須是非空字串';
  if (typeof c.content !== 'string') return 'content 必須是字串';
  if (!STAGES.includes(c.stage)) return 'stage 只允許 ' + STAGES.join('/');
  if (!RISKS.includes(c.risk)) return 'risk 只允許 ' + RISKS.join('/');
  if (typeof c.owner !== 'string') return 'owner 必須是字串';
  if (typeof c.agent !== 'string') return 'agent 必須是字串';
  if (typeof c.approvalRequired !== 'boolean') return 'approvalRequired 必須是 boolean';
  if (typeof c.createdAt !== 'string') return 'createdAt 必須是字串';
  if (!Number.isInteger(c.order) || c.order < 1) return 'order 必須是 >= 1 的整數';
  if (typeof c.epic !== 'string') return 'epic 必須是字串';
  if (typeof c.userStory !== 'string') return 'userStory 必須是字串';
  if (!TRACKS.includes(c.track)) return 'track 只允許 ' + TRACKS.join('/');

  if (!isPlainObject(c.readiness)) return 'readiness 必須是 object';
  for (const k of READINESS_KEYS) {
    if (typeof c.readiness[k] !== 'boolean') return 'readiness.' + k + ' 必須是 boolean';
  }
  if (!isPlainObject(c.gates)) return 'gates 必須是 object';
  for (const k of GATE_KEYS) {
    if (typeof c.gates[k] !== 'boolean') return 'gates.' + k + ' 必須是 boolean';
  }
  if (!isPlainObject(c.links)) return 'links 必須是 object';
  for (const k of LINK_KEYS) {
    if (typeof c.links[k] !== 'string') return 'links.' + k + ' 必須是字串';
  }
  if (!Array.isArray(c.refs) || c.refs.some((r) => typeof r !== 'string')) {
    return 'refs 必須是字串陣列';
  }
  if (!isPlainObject(c.evidence)) return 'evidence 必須是 object';
  if (!Array.isArray(c.evidence.commands) || c.evidence.commands.some((x) => typeof x !== 'string')) {
    return 'evidence.commands 必須是字串陣列';
  }
  if (!Array.isArray(c.evidence.findings) || c.evidence.findings.some((x) => typeof x !== 'string')) {
    return 'evidence.findings 必須是字串陣列';
  }
  if (typeof c.evidence.residual !== 'string') return 'evidence.residual 必須是字串';
  if (!Array.isArray(c.comments)) return 'comments 必須是陣列';
  for (const item of c.comments) {
    if (!isPlainObject(item)) return 'comments 每項必須是 { name, time, text } object';
    if (typeof item.name !== 'string') return 'comments[].name 必須是字串';
    if (typeof item.time !== 'string') return 'comments[].time 必須是字串';
    if (typeof item.text !== 'string') return 'comments[].text 必須是字串';
  }
  return null;
}

function defaultObj(keys, value) {
  const o = {};
  for (const k of keys) o[k] = value;
  return o;
}

/** 舊資料 / 精簡 client 相容：缺少的欄位補預設值（in-place） */
function fillDefaults(c) {
  if (!isPlainObject(c)) return c;
  if (c.content === undefined) c.content = '';
  if (c.agent === undefined) c.agent = '';
  if (c.approvalRequired === undefined) c.approvalRequired = false;
  if (c.epic === undefined) c.epic = '';
  if (c.userStory === undefined) c.userStory = '';
  if (c.track === undefined) c.track = 'n/a';
  if (!isPlainObject(c.readiness)) c.readiness = defaultObj(READINESS_KEYS, false);
  else for (const k of READINESS_KEYS) if (c.readiness[k] === undefined) c.readiness[k] = false;
  if (!isPlainObject(c.gates)) c.gates = defaultObj(GATE_KEYS, false);
  else for (const k of GATE_KEYS) if (c.gates[k] === undefined) c.gates[k] = false;
  if (!isPlainObject(c.links)) c.links = defaultObj(LINK_KEYS, '');
  else for (const k of LINK_KEYS) if (c.links[k] === undefined) c.links[k] = '';
  if (!Array.isArray(c.refs)) c.refs = [];
  if (!isPlainObject(c.evidence)) c.evidence = { commands: [], findings: [], residual: '' };
  if (!Array.isArray(c.comments)) c.comments = [];
  return c;
}

/** 固定 key 順序寫檔，2 空格縮排 + 結尾換行，減少 git diff 噪音 */
function writeCard(c) {
  const normalized = {
    id: c.id,
    title: c.title,
    content: c.content,
    stage: c.stage,
    risk: c.risk,
    owner: c.owner,
    agent: c.agent,
    approvalRequired: c.approvalRequired,
    createdAt: c.createdAt,
    epic: c.epic,
    userStory: c.userStory,
    track: c.track,
    order: c.order,
    readiness: c.readiness,
    gates: c.gates,
    links: c.links,
    refs: c.refs,
    evidence: c.evidence,
    comments: c.comments
  };
  const file = path.join(CARDS_DIR, c.id + '.json');
  fs.writeFileSync(file, JSON.stringify(normalized, null, 2) + '\n', 'utf8');
}

function readAllCards() {
  const files = fs.readdirSync(CARDS_DIR).filter((f) => f.endsWith('.json'));
  const cards = files.map((f) =>
    fillDefaults(JSON.parse(fs.readFileSync(path.join(CARDS_DIR, f), 'utf8')))
  );
  cards.sort((a, b) =>
    STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage) ||
    a.order - b.order ||
    a.id.localeCompare(b.id)
  );
  return cards;
}

function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

/* ── route handlers ── */

function handleList(res) {
  sendJson(res, 200, readAllCards());
}

function handleEpics(res) {
  try {
    const epics = JSON.parse(fs.readFileSync(EPICS_JSON, 'utf8'));
    sendJson(res, 200, epics);
  } catch (err) {
    sendJson(res, 500, { error: '讀取 epics.json 失敗：' + err.message });
  }
}

function handlePutOne(res, id, body) {
  const c = fillDefaults(JSON.parse(body));
  if (!isPlainObject(c)) return sendJson(res, 400, { error: 'body 必須是完整 card object' });
  if (c.id !== id) return sendJson(res, 400, { error: 'body 的 id 與 URL 不一致' });
  const err = validateCard(c);
  if (err) return sendJson(res, 400, { error: err });
  writeCard(c);
  sendJson(res, 200, c);
}

function handlePutBulk(res, body) {
  const list = JSON.parse(body);
  if (!Array.isArray(list)) return sendJson(res, 400, { error: 'body 必須是 card 陣列' });
  for (const c of list) {
    const err = validateCard(fillDefaults(c));
    if (err) return sendJson(res, 400, { error: (c && c.id ? c.id + ': ' : '') + err });
  }
  for (const c of list) writeCard(c);
  sendJson(res, 200, { updated: list.length });
}

function handlePost(res, body) {
  const input = JSON.parse(body);
  if (!isPlainObject(input)) return sendJson(res, 400, { error: 'body 必須是 object' });
  const existing = readAllCards();
  const maxNum = existing.reduce((m, c) => Math.max(m, parseInt(c.id.slice(ID_PREFIX.length + 1), 10)), 0);
  const stage = STAGES.includes(input.stage) ? input.stage : 'backlog';
  const inColumn = existing.filter((c) => c.stage === stage);
  const card = fillDefaults({
    id: ID_PREFIX + '-' + String(maxNum + 1).padStart(3, '0'),
    title: typeof input.title === 'string' ? input.title.trim() : '',
    content: typeof input.content === 'string' ? input.content : '',
    stage,
    risk: RISKS.includes(input.risk) ? input.risk : 'low',
    owner: typeof input.owner === 'string' ? input.owner : 'PJ',
    agent: typeof input.agent === 'string' ? input.agent : '',
    approvalRequired: !!input.approvalRequired,
    createdAt: todayStr(),
    epic: typeof input.epic === 'string' ? input.epic : '',
    userStory: typeof input.userStory === 'string' ? input.userStory : '',
    track: TRACKS.includes(input.track) ? input.track : 'n/a',
    order: inColumn.length + 1,
    readiness: input.readiness,
    gates: input.gates,
    links: input.links,
    refs: Array.isArray(input.refs) ? input.refs : [],
    evidence: input.evidence,
    comments: []
  });
  const err = validateCard(card);
  if (err) return sendJson(res, 400, { error: err });
  writeCard(card);
  sendJson(res, 201, card);
}

function handleDelete(res, id) {
  const file = path.join(CARDS_DIR, id + '.json');
  if (!fs.existsSync(file)) return sendJson(res, 404, { error: id + ' 不存在' });
  fs.unlinkSync(file);
  sendJson(res, 200, { deleted: id });
}

/* ── server ── */

const server = http.createServer(async (req, res) => {
  const pathname = (req.url || '/').split('?')[0];
  try {
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(INDEX_HTML));
      return;
    }

    if (pathname === '/api/epics') {
      if (req.method === 'GET') return handleEpics(res);
      return sendJson(res, 405, { error: 'method not allowed' });
    }

    if (pathname === '/api/cards') {
      if (req.method === 'GET') return handleList(res);
      if (req.method === 'PUT') return handlePutBulk(res, await readBody(req));
      if (req.method === 'POST') return handlePost(res, await readBody(req));
      return sendJson(res, 405, { error: 'method not allowed' });
    }

    const match = pathname.match(/^\/api\/cards\/([^/]+)$/);
    if (match) {
      const id = decodeURIComponent(match[1]);
      if (!ID_RE.test(id)) return sendJson(res, 400, { error: 'id 必須符合 ^' + ID_PREFIX + '-\\d{3,}$' });
      if (req.method === 'PUT') return handlePutOne(res, id, await readBody(req));
      if (req.method === 'DELETE') return handleDelete(res, id);
      return sendJson(res, 405, { error: 'method not allowed' });
    }

    sendJson(res, 404, { error: 'not found' });
  } catch (err) {
    if (err instanceof SyntaxError) {
      sendJson(res, 400, { error: 'body 不是合法 JSON：' + err.message });
    } else {
      sendJson(res, 500, { error: '寫入失敗：' + err.message });
    }
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[kanban] port ${PORT} 已被占用。請先關掉占用的程序（lsof -i :${PORT}）再重新啟動。`);
  } else {
    console.error('[kanban] server 啟動失敗：' + err.message);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`[kanban] 治理看板 → http://${HOST}:${PORT}`);
  console.log(`[kanban] 資料目錄：${CARDS_DIR}`);
});
