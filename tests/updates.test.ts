import test from "node:test";
import assert from "node:assert/strict";
import { UpdateController, type UpdatePackage } from "../src/lib/updates.ts";

function fixture() {
  let installs = 0, closes = 0;
  const update: UpdatePackage = {
    version: "1.0.2", body: "本次更新", close: async () => { closes++; },
    download: async progress => {
      progress({ event: "Started", data: { contentLength: 100 } });
      progress({ event: "Progress", data: { chunkLength: 60 } });
      progress({ event: "Progress", data: { chunkLength: 40 } });
      progress({ event: "Finished" });
    },
    install: async options => { assert.equal(options.restartAfterInstall, true); installs++; },
  };
  return { update, installs: () => installs, closes: () => closes };
}
test("启动和手动检查并发时复用正在执行的请求，无更新返回最新状态", async () => {
  let resolve!: (value: null) => void, calls = 0;
  const controller = new UpdateController(() => { calls++; return new Promise(r => { resolve = r; }); });
  const first = controller.check();
  await controller.check();
  await Promise.resolve();
  assert.equal(calls, 1);
  resolve(null); await first;
  assert.equal(controller.getSnapshot().phase, "latest");
});
test("离线检查可重试，重新检查释放旧资源并清理旧版本提示", async () => {
  const f = fixture(); let attempt = 0;
  const controller = new UpdateController(async () => { if (++attempt === 1) throw Error("offline"); return attempt === 2 ? f.update : null; });
  await controller.check(); assert.equal(controller.getSnapshot().phase, "error");
  await controller.check(); assert.equal(controller.getSnapshot().version, "1.0.2");
  await controller.check(); assert.equal(controller.getSnapshot().phase, "latest");
  assert.equal(controller.getSnapshot().version, ""); assert.equal(f.closes(), 1);
});
test("编辑阻止安装，下载校验通过后才安装；进度累计且只启动一次安装", async () => {
  const f = fixture(); const controller = new UpdateController(async () => f.update);
  await controller.check();
  await controller.install(() => false); assert.equal(f.installs(), 0);
  await Promise.all([controller.install(() => true), controller.install(() => true), controller.check()]);
  assert.equal(controller.getSnapshot().received, 100); assert.equal(f.installs(), 1);
  assert.equal(controller.getSnapshot().phase, "installing");
});
test("下载或签名校验失败不安装，重试成功；下载后再次检查编辑状态", async () => {
  const f = fixture(); const download = f.update.download;
  f.update.download = async () => { throw Error("invalid signature"); };
  const controller = new UpdateController(async () => f.update);
  await controller.check(); await controller.install(() => true);
  assert.equal(f.installs(), 0); assert.equal(controller.getSnapshot().phase, "error");
  f.update.download = download;
  let allowed = true;
  f.update.download = async progress => { await download(progress, { timeout: 300_000 }); allowed = false; };
  await controller.install(() => allowed); assert.equal(f.installs(), 0);
  assert.equal(controller.getSnapshot().phase, "available");
  f.update.download = download;
  await controller.install(() => true); assert.equal(f.installs(), 1);
});
