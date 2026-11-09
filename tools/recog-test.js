/* 旋律识别测试：合成「像真人」的哼唱（滑音、颤音、越唱越跑调、每个音随机偏一点、连着哼不断气），
   跑一遍识别，和标准答案比。在 index.html 打开后，把这个文件的内容贴进浏览器控制台运行：
     await HT.run()          → 打印每首歌、每种唱法的错误率
   错误率 = 识别出的音高序列和标准答案之间的编辑距离 ÷ 音符数（0 = 全对）。 */
window.HT = (() => {
  const MELS = {
    小星星: [[60, 1], [60, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2], [65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [60, 2]],
    欢乐颂: [[64, 1], [64, 1], [65, 1], [67, 1], [67, 1], [65, 1], [64, 1], [62, 1], [60, 1], [60, 1], [62, 1], [64, 1], [64, 1.5], [62, 0.5], [62, 2]],
    生日歌: [[67, 0.75], [67, 0.25], [69, 1], [67, 1], [72, 1], [71, 2], [67, 0.75], [67, 0.25], [69, 1], [67, 1], [74, 1], [72, 2]],
    两只老虎: [[60, 1], [62, 1], [64, 1], [60, 1], [60, 1], [62, 1], [64, 1], [60, 1], [64, 1], [65, 1], [67, 2], [64, 1], [65, 1], [67, 2]],
    茉莉花: [[64, 1], [64, 0.5], [67, 0.5], [69, 0.5], [72, 0.5], [72, 0.5], [69, 0.5], [67, 1], [67, 0.5], [69, 0.5], [67, 2]],
  };
  // 每个音：目标音高 + 随机偏差 + 越唱越偏（drift，单位半音）+ 颤音；音与音之间滑过去
  async function make({ mel, shift = 0, bpm = 92, legato = true, vib = 0.25, drift = 0.5, jitter = 0.2, tempoWobble = 0.06, seed = 1 }) {
    let rs = seed; const rnd = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
    const sr = 44100, beat = 60 / bpm, lead = 0.4;
    const notes = []; let t = lead;
    for (const [m, b] of mel) { const d = b * beat * (1 + (rnd() - 0.5) * 2 * tempoWobble); notes.push({ m, s: t, e: t + d, det: (rnd() - 0.5) * 2 * jitter }); t += d; }
    const T = t + 0.5, cr = 1000, n = Math.ceil(T * cr), freq = new Float32Array(n), amp = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const tt = i / cr, k = notes.findIndex(x => tt >= x.s && tt < x.e);
      if (k < 0) { freq[i] = freq[i - 1] || 100; amp[i] = 0; continue; }
      const x = notes[k], prev = notes[k - 1], into = tt - x.s;
      let p = x.m + shift + x.det + drift * (tt / T);
      if (prev && legato && into < 0.08) p = (prev.m + shift + prev.det + drift * (tt / T)) + (p - (prev.m + shift + prev.det + drift * (tt / T))) * (into / 0.08);
      if (x.e - x.s > 0.5 && into > 0.25) p += vib * Math.sin(2 * Math.PI * 5.5 * tt) * Math.min(1, (into - 0.25) / 0.2);
      freq[i] = 440 * Math.pow(2, (p - 69) / 12);
      let a = 0.6 * (1 + 0.15 * Math.sin(2 * Math.PI * 0.7 * tt));
      const left = x.e - tt;
      if (legato) { const same = prev && prev.m === x.m; if (into < 0.05 && (same || !prev || prev.e < x.s - 1e-3)) a *= same ? 0.35 + into / 0.05 * 0.65 : into / 0.05; }
      else { if (into < 0.04) a *= into / 0.04; if (left < 0.08) a *= Math.max(0, left / 0.08) * 0.9 + 0.05; }
      amp[i] = a;
    }
    const oc = new OfflineAudioContext(1, Math.ceil(T * sr), sr);
    const o = oc.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueCurveAtTime(freq, 0, T);
    const g = oc.createGain(); g.gain.setValueCurveAtTime(amp, 0, T);
    const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;   // 闭嘴哼“嗯”：高频很弱
    const pk = oc.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 280; pk.gain.value = 8; pk.Q.value = 1.5;
    const nz = oc.createBufferSource(), nb = oc.createBuffer(1, oc.length, sr), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = (rnd() * 2 - 1) * 0.004;   // 底噪
    nz.buffer = nb;
    o.connect(lp); lp.connect(pk); pk.connect(g); g.connect(oc.destination); nz.connect(oc.destination);
    o.start(0); nz.start(0);
    return { buf: await oc.startRendering(), truth: notes.map(x => x.m + Math.round(shift)) };
  }
  function edit(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  async function score(opts) {
    const { buf, truth } = await make(opts);
    S.buf = buf; S.frames = await detectPitch(await toMono16k(buf), () => {});
    rebuildNotes(true);
    const raw = S.raw.filter(n => !n.off).sort((a, b) => a.start - b.start).map(n => n.midi);
    const fin = S.song ? S.song.mel.map(n => n.m) : [];
    const shape = a => Math.min(...[-2, -1, 0, 1, 2].map(k => edit(a.map(x => x - k), truth))) / truth.length;   // 整首一起高低几个半音不算错
    return { raw: edit(raw, truth) / truth.length, fin: edit(fin, truth) / truth.length, rawShape: shape(raw), finShape: shape(fin), got: raw.length, want: truth.length };
  }
  const VOICES = { 男声: -12, 女声: 0 };
  async function run(extra = {}) {
    const rows = []; let sr = 0, sf = 0, ss = 0, sfs = 0, n = 0;
    for (const [name, mel] of Object.entries(MELS)) for (const [vn, sh] of Object.entries(VOICES)) for (const legato of [true, false]) {
      const r = await score({ mel, shift: sh + 0.35, legato, seed: name.length * 7 + sh + (legato ? 1 : 2), ...extra });
      rows.push(`${name} ${vn} ${legato ? '连着哼' : '断开哼'}：旋律形状 ${(r.rawShape * 100).toFixed(0)}% 错 · 编曲后 ${(r.finShape * 100).toFixed(0)}% · 绝对音高 ${(r.raw * 100).toFixed(0)}%（${r.got}/${r.want} 个音）`);
      sr += r.raw; sf += r.fin; ss += r.rawShape; sfs += r.finShape; n++;
    }
    rows.push(`平均：旋律形状 ${(ss / n * 100).toFixed(1)}% 错，编曲后 ${(sfs / n * 100).toFixed(1)}% 错；绝对音高 ${(sr / n * 100).toFixed(1)}% / ${(sf / n * 100).toFixed(1)}%`);
    return rows;
  }
  return { MELS, make, score, run };
})();
