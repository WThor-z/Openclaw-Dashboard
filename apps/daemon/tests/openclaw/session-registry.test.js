import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { resolveConfiguredAgentModel } from "../../src/platform/openclaw/session-registry.js";

const temporaryDirectories = [];

afterEach(async () => {
  while (temporaryDirectories.length > 0) {
    const dirPath = temporaryDirectories.pop();
    await rm(dirPath, { recursive: true, force: true });
  }
});

describe("session registry configured model resolution", () => {
  it("supports object-style defaults model with primary field", async () => {
    const homeDir = await mkdtemp(
      path.join(os.tmpdir(), "daemon-session-registry-default-model-object-")
    );
    temporaryDirectories.push(homeDir);
    const openclawDir = path.join(homeDir, ".openclaw");
    await mkdir(openclawDir, { recursive: true });
    await writeFile(
      path.join(openclawDir, "openclaw.json"),
      JSON.stringify(
        {
          agents: {
            defaults: {
              model: {
                primary: "openai-codex/gpt-5.3-codex",
                fallbacks: []
              }
            }
          }
        },
        null,
        2
      ),
      "utf8"
    );

    const env = { HOME: homeDir, USERPROFILE: homeDir };

    await expect(resolveConfiguredAgentModel("PERSONAL-ASSISTANT-2", { env })).resolves.toBe(
      "openai-codex/gpt-5.3-codex"
    );
  });

  it("prefers agents.list model over agents.defaults model", async () => {
    const homeDir = await mkdtemp(path.join(os.tmpdir(), "daemon-session-registry-model-"));
    temporaryDirectories.push(homeDir);
    const openclawDir = path.join(homeDir, ".openclaw");
    await mkdir(openclawDir, { recursive: true });
    await writeFile(
      path.join(openclawDir, "openclaw.json"),
      JSON.stringify(
        {
          agents: {
            defaults: {
              model: "gpt-default"
            },
            list: [
              {
                id: "agent-main",
                model: "gpt-agent-main"
              },
              {
                id: "agent-reviewer"
              }
            ]
          }
        },
        null,
        2
      ),
      "utf8"
    );

    const env = { HOME: homeDir, USERPROFILE: homeDir };

    await expect(resolveConfiguredAgentModel("agent-main", { env })).resolves.toBe(
      "gpt-agent-main"
    );
    await expect(resolveConfiguredAgentModel("agent-reviewer", { env })).resolves.toBe(
      "gpt-default"
    );
  });

  it("supports legacy routing.agents.<id>.model fallback", async () => {
    const homeDir = await mkdtemp(path.join(os.tmpdir(), "daemon-session-registry-legacy-"));
    temporaryDirectories.push(homeDir);
    const stateDir = path.join(homeDir, ".clawdbot");
    await mkdir(stateDir, { recursive: true });
    await writeFile(
      path.join(stateDir, "clawdbot.json"),
      JSON.stringify(
        {
          agents: {
            defaults: {
              model: "gpt-default-legacy"
            }
          },
          routing: {
            agents: {
              legacy: {
                model: "gpt-legacy"
              },
              inherited: {}
            }
          }
        },
        null,
        2
      ),
      "utf8"
    );

    const env = { HOME: homeDir, USERPROFILE: homeDir };

    await expect(resolveConfiguredAgentModel("legacy", { env })).resolves.toBe("gpt-legacy");
    await expect(resolveConfiguredAgentModel("inherited", { env })).resolves.toBe(
      "gpt-default-legacy"
    );
  });
});
