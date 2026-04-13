import fs from "node:fs";

const globalsPath = "e:/mission-control/src/app/globals.css";
let g = fs.readFileSync(globalsPath, "utf8");
const mouthBlock = `
@keyframes mc-biped-mouth-talk {
  0%,
  100% {
    transform: translateY(0) scaleY(1);
  }
  25% {
    transform: translateY(0.5px) scaleY(1.12);
  }
  50% {
    transform: translateY(1px) scaleY(0.92);
  }
  75% {
    transform: translateY(0.5px) scaleY(1.08);
  }
}

.mc-biped-mouth-talk {
  animation: mc-biped-mouth-talk 0.42s ease-in-out infinite;
  transform-origin: 70px 112px;
  transform-box: fill-box;
}

`;
if (!g.includes("mc-biped-mouth-talk")) {
  g = g.replace(".mc-biped-scanner-tip {", mouthBlock + ".mc-biped-scanner-tip {");
  fs.writeFileSync(globalsPath, g);
  console.log("globals patched");
} else console.log("globals skip");

const botPath = "e:/mission-control/src/components/AgentBot.tsx";
let b = fs.readFileSync(botPath, "utf8");
b = b.replace(
  /<g className="mc-biped-mouth" filter=\{`url\(#\$\{uid\}-mouth-soft\)`\}>/,
  `<g
          className="mc-biped-mouth mc-biped-mouth-talk"
          transform="translate(0, 7)"
          filter={\`url(#\${uid}-mouth-soft)\`}
        >`
);
const oldBot = `export function AgentBot({ variant, icon: Icon, className = "" }: AgentBotProps) {
  const uid = useId().replace(/:/g, "");

  const scale = variant === "eugene" ? "scale-[1.14]" : "scale-100";

  return (
    <div
      className={"relative flex flex-col items-center justify-end bg-transparent " + scale + " " + className}
      style={{ width: "7.75rem", height: "11.5rem" }}
    >
      <div className="relative h-[11rem] w-[7.25rem] bg-transparent">
        <BipedRobot uid={uid} variant={variant} />
        <div className="pointer-events-none absolute bottom-[18%] left-1/2 flex -translate-x-1/2 items-center justify-center bg-transparent">
          <Icon
            className="h-[18px] w-[18px] text-white/92 [filter:drop-shadow(0_0_5px_rgba(0,0,0,0.95))_drop-shadow(0_1px_2px_rgba(0,0,0,0.8))]"
            strokeWidth={1.35}
          />
        </div>
      </div>
    </div>
  );
}`;
const newBot = `export function AgentBot({ variant, icon: Icon, className = "" }: AgentBotProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <div
      className={"relative flex flex-col items-center justify-end bg-transparent " + className}
      style={{ width: "3.9rem", height: "5.85rem" }}
    >
      <div className="relative h-[5.5rem] w-[3.65rem] bg-transparent">
        <BipedRobot uid={uid} variant={variant} />
        <div className="pointer-events-none absolute bottom-[18%] left-1/2 flex -translate-x-1/2 items-center justify-center bg-transparent">
          <Icon
            className="h-[9px] w-[9px] text-white/92 [filter:drop-shadow(0_0_3px_rgba(0,0,0,0.95))_drop-shadow(0_1px_1px_rgba(0,0,0,0.8))]"
            strokeWidth={1.35}
          />
        </div>
      </div>
    </div>
  );
}`;
if (b.includes("7.75rem")) b = b.replace(oldBot, newBot);
fs.writeFileSync(botPath, b);
console.log("bot patched", b.includes("3.9rem"));
