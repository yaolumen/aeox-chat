// src/web/assets/i18n.ts
var lang = "en";
try {
  const saved = localStorage.getItem("aeox_lang");
  if (saved === "en" || saved === "zh") lang = saved;
  else if (navigator.language && navigator.language.toLowerCase().startsWith("zh")) lang = "zh";
} catch {
  lang = "en";
}
var DICT = {
  "sb.pool": ["pool", "\u6C60"],
  "sb.routed": ["routed today", "\u4ECA\u65E5\u8DEF\u7531"],
  "sb.events": ["events 24h", "24h \u4E8B\u4EF6"],
  "chat.pagetitle": ["aeox chat \u2014 one prompt, many engines", "aeox chat \u2014 \u4E00\u6B21\u63D0\u95EE\uFF0C\u591A\u5F15\u64CE\u54CD\u5E94"],
  "chat.newChat": ["new chat", "\u65B0\u5BF9\u8BDD"],
  "chat.sessions": ["sessions", "\u4F1A\u8BDD"],
  "chat.histSync": ["history sync \u2014 coming soon", "\u5386\u53F2\u540C\u6B65 \u2014 \u5373\u5C06\u4E0A\u7EBF"],
  "chat.quota": ["quota", "\u989D\u5EA6"],
  "chat.anon": ["anon session \xB7 no account", "\u533F\u540D\u4F1A\u8BDD \xB7 \u65E0\u9700\u8D26\u53F7"],
  "chat.welcome": ["How can I help?", "\u6709\u4EC0\u4E48\u53EF\u4EE5\u5E2E\u4F60\uFF1F"],
  "chat.wline": ["no account \xB7 local history \xB7 multi-engine routing", "\u514D\u6CE8\u518C \xB7 \u672C\u5730\u5386\u53F2 \xB7 \u591A\u5F15\u64CE\u8DEF\u7531"],
  "chat.sugg1": ["what is the key engine?", "\u4EC0\u4E48\u662F Key \u5F15\u64CE\uFF1F"],
  "chat.sugg1s": ["routing, failover, cooldown", "\u8DEF\u7531 \xB7 \u6545\u969C\u8F6C\u79FB \xB7 \u51B7\u5374"],
  "chat.sugg2": ["write a hono sse endpoint", "\u5199\u4E00\u4E2A Hono SSE \u7AEF\u70B9"],
  "chat.sugg2s": ["streaming proxy in a few lines", "\u51E0\u884C\u4EE3\u7801\u7684\u6D41\u5F0F\u4EE3\u7406"],
  "chat.sugg3": ["deepseek vs qwen pricing", "DeepSeek \u4E0E Qwen \u5B9A\u4EF7\u5BF9\u6BD4"],
  "chat.sugg3s": ["rough cost per 1M tokens", "\u6BCF\u767E\u4E07 token \u6210\u672C\u4F30\u7B97"],
  "chat.sugg4": ["explain sse like i'm five", "\u7528\u6700\u7B80\u5355\u7684\u8BDD\u8BB2\u8BB2 SSE"],
  "chat.sugg4s": ["server-sent events, gently", "\u670D\u52A1\u7AEF\u63A8\u9001\u4E8B\u4EF6\u5165\u95E8"],
  "chat.ph": ["Ask anything \u2014 no account needed", "\u968F\u4FBF\u95EE \u2014 \u65E0\u9700\u8D26\u53F7"],
  "chat.send": ["send", "\u53D1\u9001"],
  "chat.line": ["line", "\u6362\u884C"],
  "chat.attach": ["attach \xB7 coming soon", "\u9644\u4EF6 \xB7 \u5373\u5C06\u4E0A\u7EBF"],
  "hub.tagNoRetain": ["NO DATA RETENTION", "\u6570\u636E\u4E0D\u4FDD\u5B58"],
  "hub.privacy": ["no accounts, no chat storage \u2014 server keeps only operational logs, auto-purged within 90 days (events last 500, quota 7d)", "\u65E0\u9700\u8D26\u53F7\u3001\u4E0D\u5B58\u804A\u5929\u5185\u5BB9 \u2014 \u670D\u52A1\u5668\u4EC5\u4FDD\u7559\u8FD0\u7EF4\u65E5\u5FD7\uFF0C90 \u5929\u5185\u81EA\u52A8\u6E05\u7406\uFF08\u4E8B\u4EF6\u7559 500 \u6761\u3001\u914D\u989D 7 \u5929\uFF09"],
  "chat.note": ["beta \xB7 tech demo \u2014 history stays in your browser, the server stores no chat content \xB7 30 msgs/day \xB7 server logs auto-purge (events last 500, usage 90d, quota 7d)", "\u6D4B\u8BD5\u7248 \xB7 \u6280\u672F\u5C55\u793A \u2014 \u5386\u53F2\u4EC5\u5B58\u4F60\u7684\u6D4F\u89C8\u5668\uFF0C\u670D\u52A1\u5668\u4E0D\u4FDD\u5B58\u4EFB\u4F55\u804A\u5929\u5185\u5BB9 \xB7 \u6BCF\u5929 30 \u6761 \xB7 \u670D\u52A1\u5668\u65E5\u5FD7\u81EA\u52A8\u6E05\u7406\uFF08\u4E8B\u4EF6\u7559 500 \u6761\u3001\u7528\u91CF 90 \u5929\u3001\u914D\u989D 7 \u5929\uFF09"],
  "chat.engine": ["Engine", "\u5F15\u64CE"],
  "chat.keypool": ["key pool", "key \u6C60"],
  "chat.ttft": ["ttft \xB7 this session", "ttft \xB7 \u672C\u6B21\u4F1A\u8BDD"],
  "chat.tps": ["tokens/s", "tokens/s"],
  "chat.avg": ["avg", "\u5747\u503C"],
  "chat.now": ["now", "\u5F53\u524D"],
  "chat.console": ["engine console \u2192", "\u5F15\u64CE\u63A7\u5236\u53F0 \u2192"],
  "chat.failover": ["failover", "\u6545\u969C\u8F6C\u79FB"],
  "chat.limit": ["daily limit reached \u2014 resets tomorrow", "\u5DF2\u8FBE\u6BCF\u65E5\u4E0A\u9650 \u2014 \u660E\u5929\u91CD\u7F6E"],
  "chat.noKeys": ["engine has no available keys \u2014 try again later", "\u5F15\u64CE\u6682\u65E0\u53EF\u7528 Key \u2014 \u7A0D\u540E\u518D\u8BD5"],
  "chat.err": ["request failed \u2014 check connection and retry", "\u8BF7\u6C42\u5931\u8D25 \u2014 \u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5"],
  "chat.empty": ["empty response from engine \u2014 resend", "\u5F15\u64CE\u8FD4\u56DE\u7A7A\u54CD\u5E94 \u2014 \u8BF7\u91CD\u53D1"],
  "chat.st": ["status", "\u72B6\u6001"],
  "chat.cd": ["cooldown", "\u51B7\u5374"],
  "chat.standby": ["standby", "\u5F85\u547D"],
  "chat.trace": ["trace", "trace"],
  "eng.pagetitle": ["aeox chat \u2014 key engine", "aeox chat \u2014 Key \u5F15\u64CE"],
  "eng.title": ["Key engine \u2014 live routing", "Key \u5F15\u64CE \u2014 \u5B9E\u65F6\u8DEF\u7531"],
  "eng.live": ["LIVE", "LIVE"],
  "eng.strategy": ["strategy: priority", "\u7B56\u7565\uFF1Apriority"],
  "eng.stratDesc": ["always drain the highest-priority healthy key first; lower priorities only serve as failover", "\u6C38\u8FDC\u5148\u6D88\u8017\u4F18\u5148\u7EA7\u6700\u9AD8\u4E14\u5065\u5EB7\u7684 Key\uFF1B\u4F4E\u4F18\u5148\u7EA7\u4EC5\u4F5C\u6545\u969C\u8F6C\u79FB"],
  "eng.routed": ["routed today", "\u4ECA\u65E5\u8DEF\u7531"],
  "eng.events": ["events 24h", "24h \u4E8B\u4EF6"],
  "eng.health": ["pool health", "\u6C60\u5065\u5EB7\u5EA6"],
  "eng.cooldown": ["in cooldown", "\u51B7\u5374\u4E2D"],
  "eng.standby": ["standby", "\u5F85\u547D"],
  "eng.feed": ["Routing feed", "\u8DEF\u7531\u4E8B\u4EF6\u6D41"],
  "eng.autoscroll": ["auto-refresh \xB7 2s", "\u81EA\u52A8\u5237\u65B0 \xB7 2 \u79D2"],
  "eng.rack": ["Key rack", "Key \u673A\u67B6"],
  "eng.next": ["highlighted = serves next", "\u9AD8\u4EAE = \u4E0B\u4E00\u4E2A\u670D\u52A1"],
  "eng.model": ["model", "\u6A21\u578B"],
  "eng.step1n": ["01 / SELECT", "01 / \u9009\u62E9"],
  "eng.step1h": ["Pick by priority", "\u6309\u4F18\u5148\u7EA7\u9009\u53D6"],
  "eng.step1p": ["The engine always picks the highest-priority healthy key, skipping keys in cooldown or over budget.", "\u5F15\u64CE\u603B\u662F\u9009\u53D6\u4F18\u5148\u7EA7\u6700\u9AD8\u4E14\u5065\u5EB7\u7684 Key\uFF0C\u81EA\u52A8\u8DF3\u8FC7\u51B7\u5374\u4E2D\u6216\u8D85\u9884\u7B97\u7684 Key\u3002"],
  "eng.step2n": ["02 / DETECT", "02 / \u8BC6\u522B"],
  "eng.step2h": ["Classify failure", "\u5931\u8D25\u5206\u7C7B"],
  "eng.step2p": ["401/403 disables the key permanently. 429/5xx starts a 60s cooldown and the request retries on the next key before the first token.", "401/403 \u6C38\u4E45\u7981\u7528\u8BE5 Key\uFF1B429/5xx \u89E6\u53D1 60 \u79D2\u51B7\u5374\uFF0C\u5E76\u5728\u9996 token \u524D\u6362\u4E0B\u4E00\u4E2A Key \u91CD\u8BD5\u3002"],
  "eng.step3n": ["03 / RECOVER", "03 / \u81EA\u6108"],
  "eng.step3h": ["Self-heal", "\u81EA\u52A8\u6062\u590D"],
  "eng.step3p": ["Expired cooldowns rejoin the pool automatically. Monthly budget caps are the final guard.", "\u51B7\u5374\u5230\u671F\u81EA\u52A8\u56DE\u5F52 Key \u6C60\uFF1B\u6708\u9884\u7B97\u662F\u6700\u540E\u4E00\u9053\u9632\u7EBF\u3002"],
  "eng.foot": ["public view is masked \u2014 no key material is ever exposed", "\u516C\u5F00\u89C6\u56FE\u5DF2\u8131\u654F \u2014 \u7EDD\u4E0D\u66B4\u9732\u4EFB\u4F55 Key \u6750\u6599"],
  "eng.cleanup": ["data hygiene: events auto-trimmed to the last 500, usage stats kept 90 days, quota counters kept 7 days \u2014 nothing else is stored", "\u6570\u636E\u6CBB\u7406\uFF1A\u4E8B\u4EF6\u81EA\u52A8\u53EA\u7559\u6700\u8FD1 500 \u6761\uFF0C\u7528\u91CF\u7EDF\u8BA1\u4FDD\u7559 90 \u5929\uFF0C\u914D\u989D\u8BA1\u6570\u4FDD\u7559 7 \u5929 \u2014 \u9664\u6B64\u4E4B\u5916\u4E0D\u5B58\u50A8\u4EFB\u4F55\u6570\u636E"],
  "eng.wait": ["waiting for engine\u2026", "\u7B49\u5F85\u5F15\u64CE\u6570\u636E\u2026"],
  "hub.pagetitle": ["aeox chat \u2014 the engine is the interface", "aeox chat \u2014 \u5F15\u64CE\u5373\u754C\u9762"],
  "hub.eyebrow": ["// multi-engine ai playground", "// \u591A\u5F15\u64CE AI \u6F14\u7EC3\u573A"],
  "hub.h1a": ["The engine is", "\u5F15\u64CE\uFF0C\u5373"],
  "hub.h1b": ["the interface.", "\u754C\u9762\u3002"],
  "hub.sub": [
    "One minimal chat stream, served by a pool of AI keys that route, fail over and self-heal \u2014 in public view. No accounts, no tracking; every answer is signed with the engine that produced it.",
    "\u4E00\u6761\u6781\u7B80\u804A\u5929\u6D41\uFF0C\u80CC\u540E\u662F\u7531\u591A\u4E2A AI Key \u7EC4\u6210\u7684\u6C60\uFF1A\u81EA\u52A8\u8DEF\u7531\u3001\u6545\u969C\u8F6C\u79FB\u3001\u81EA\u6211\u6062\u590D \u2014 \u5168\u7A0B\u516C\u5F00\u53EF\u89C1\u3002\u65E0\u9700\u6CE8\u518C\uFF0C\u4E0D\u505A\u8FFD\u8E2A\uFF1B\u6BCF\u6761\u56DE\u7B54\u90FD\u5E26\u6709\u4EA7\u51FA\u5B83\u7684\u5F15\u64CE\u7B7E\u540D\u3002"
  ],
  "hub.ctaChat": ["open chat \u2192", "\u6253\u5F00\u804A\u5929 \u2192"],
  "hub.ctaEngine": ["engine console", "\u5F15\u64CE\u63A7\u5236\u53F0"],
  "hub.sparkLabel": ["requests \xB7 last 24s", "\u8BF7\u6C42 \xB7 \u8FD1 24 \u79D2"],
  "hub.explore": ["explore \u2014 no account needed", "\u76F4\u63A5\u4F53\u9A8C \u2014 \u65E0\u9700\u8D26\u53F7"],
  "hub.open": ["open \u2192", "\u6253\u5F00 \u2192"],
  "hub.card1h": ["Chat", "\u804A\u5929"],
  "hub.card1p": [
    "The customer-facing stream: open layout, block-cursor streaming, inline failover events, badge rows with raw SSE traces \u2014 plus the live engine panel on the right.",
    "\u9762\u5411\u7528\u6237\u7684\u804A\u5929\u6D41\uFF1A\u5F00\u653E\u5E03\u5C40\u3001\u65B9\u5757\u5149\u6807\u6D41\u5F0F\u8F93\u51FA\u3001\u5185\u8054\u6545\u969C\u8F6C\u79FB\u4E8B\u4EF6\u3001\u5E26\u539F\u59CB SSE \u8FFD\u8E2A\u7684\u5FBD\u6807\u884C \u2014 \u53F3\u4FA7\u8FD8\u6709\u5B9E\u65F6\u5F15\u64CE\u9762\u677F\u3002"
  ],
  "hub.card2h": ["Engine console", "\u5F15\u64CE\u63A7\u5236\u53F0"],
  "hub.card2p": [
    "The machine room, full view: routing feed, key rack with cooldown countdowns and the priority strategy \u2014 masked for public eyes.",
    "\u673A\u623F\u5168\u666F\uFF1A\u8DEF\u7531\u4E8B\u4EF6\u6D41\u3001\u5E26\u51B7\u5374\u5012\u8BA1\u65F6\u7684 Key \u673A\u67B6\u4E0E\u4F18\u5148\u7EA7\u7B56\u7565 \u2014 \u516C\u5F00\u89C6\u56FE\u5DF2\u8131\u654F\u3002"
  ],
  "hub.how": ["how the engine works", "\u5F15\u64CE\u5982\u4F55\u5DE5\u4F5C"],
  "hub.step1p": [
    "The engine always picks the highest-priority healthy key via <code>priority</code>, skipping keys in cooldown or over budget.",
    "\u5F15\u64CE\u901A\u8FC7 <code>priority</code> \u7B56\u7565\u6C38\u8FDC\u5148\u9009\u4F18\u5148\u7EA7\u6700\u9AD8\u4E14\u5065\u5EB7\u7684 Key\uFF0C\u81EA\u52A8\u8DF3\u8FC7\u51B7\u5374\u4E2D\u6216\u8D85\u9884\u7B97\u7684 Key\u3002"
  ],
  "foot.mission": [
    "An independent lab building transparent, browser-native tools across SEO, AI, quant and eastern energy. No bloat, no tracking \u2014 view-source and verify.",
    "\u4E00\u4E2A\u72EC\u7ACB\u5B9E\u9A8C\u5BA4\uFF0C\u6784\u5EFA\u6A2A\u8DE8 SEO\u3001AI\u3001\u91CF\u5316\u4E0E\u4E1C\u65B9\u80FD\u91CF\u7684\u900F\u660E\u6D4F\u89C8\u5668\u7AEF\u5DE5\u5177\u3002\u4E0D\u81C3\u80BF\u3001\u4E0D\u8FFD\u8E2A \u2014\u2014 view-source \u5373\u53EF\u9A8C\u8BC1\u3002"
  ],
  "foot.thisSite": ["This site", "\u672C\u7AD9"],
  "foot.siteHub": ["Hub", "\u4E3B\u9875"],
  "foot.siteChat": ["Chat", "\u804A\u5929"],
  "foot.siteEngine": ["Engine console", "\u5F15\u64CE\u63A7\u5236\u53F0"],
  "foot.siteDemo": ["Concept demo", "\u6982\u5FF5\u6F14\u793A"],
  "foot.netAeox": ["AEOX \u2014 AI Answer Engine Diagnostics", "AEOX \u2014\u2014 AI \u5E94\u7B54\u5F15\u64CE\u8BCA\u65AD"],
  "foot.netAnchor": ["Anchor \u2014 Content Automation Engine", "Anchor \u2014\u2014 \u5185\u5BB9\u81EA\u52A8\u5316\u5F15\u64CE"],
  "foot.netCli": ["aeox-cli \u2014 AI Dev Toolbox", "aeox-cli \u2014\u2014 AI \u5F00\u53D1\u5DE5\u5177\u7BB1"],
  "foot.netChat": ["Chat \u2014 Multi-Engine AI Chat", "Chat \u2014\u2014 \u591A\u5F15\u64CE AI \u804A\u5929"],
  "foot.netShui": ["Shui \u2014 Eastern Energy Reports", "Shui \u2014\u2014 \u4E1C\u65B9\u80FD\u91CF\u62A5\u544A"],
  "foot.resources": ["Resources", "\u8D44\u6E90"],
  "foot.hubGo": ["AEOX resource hub", "AEOX \u8D44\u6E90\u4E2D\u5FC3"],
  "foot.premium": ["Premium suite \u2014 coming soon", "\u4ED8\u8D39\u5957\u4EF6 \u2014 \u5373\u5C06\u5F00\u653E"],
  "foot.bar": [
    '\xA9 2026 AEOX \xB7 Chat \u2014 Part of the AEOX network \xB7 Engine: multi-provider key pool \xB7 Runtime: Node.js + Hono \xB7 More AEOX resources on <a href="https://go.aeox.uk/" rel="noopener" target="_blank">go.aeox.uk</a> \xB7 Premium: coming soon',
    '\xA9 2026 AEOX \xB7 Chat \u2014 AEOX \u7F51\u7EDC\u6210\u5458 \xB7 \u5F15\u64CE\uFF1A\u591A Provider Key \u6C60 \xB7 \u8FD0\u884C\u65F6\uFF1ANode.js + Hono \xB7 \u66F4\u591A\u8D44\u6E90\u89C1 <a href="https://go.aeox.uk/" rel="noopener" target="_blank">go.aeox.uk</a> \xB7 \u4ED8\u8D39\u5957\u4EF6\uFF1A\u5373\u5C06\u5F00\u653E'
  ],
  "adm.pagetitle": ["aeox chat \u2014 admin", "aeox chat \u2014 \u540E\u53F0"],
  "adm.loginTitle": ["Admin \u2014 sign in", "\u540E\u53F0 \u2014 \u767B\u5F55"],
  "adm.loginHint": ["password only \xB7 session lasts 12h", "\u4EC5\u9700\u5BC6\u7801 \xB7 \u4F1A\u8BDD\u4FDD\u6301 12 \u5C0F\u65F6"],
  "adm.password": ["password", "\u5BC6\u7801"],
  "adm.enter": ["enter", "\u8FDB\u5165"],
  "adm.badPw": ["wrong password", "\u5BC6\u7801\u9519\u8BEF"],
  "adm.rateLimited": ["too many attempts \u2014 wait 10 min", "\u5C1D\u8BD5\u8FC7\u591A \u2014 \u8BF7\u7B49 10 \u5206\u949F"],
  "adm.title": ["Key management", "Key \u7BA1\u7406"],
  "adm.desc": ["Bind multiple provider keys \u2014 the engine routes, fails over and cools down automatically. Keys are encrypted at rest (AES-256-GCM) and never leave the server.", "\u7ED1\u5B9A\u591A\u5BB6 Provider \u7684 Key \u2014 \u5F15\u64CE\u81EA\u52A8\u8DEF\u7531\u3001\u6545\u969C\u8F6C\u79FB\u4E0E\u51B7\u5374\u3002Key \u4EE5 AES-256-GCM \u52A0\u5BC6\u843D\u76D8\uFF0C\u7EDD\u4E0D\u79BB\u5F00\u670D\u52A1\u5668\u3002"],
  "adm.statKeys": ["active keys", "\u53EF\u7528 Key"],
  "adm.statReq": ["requests \xB7 month", "\u8BF7\u6C42 \xB7 \u672C\u6708"],
  "adm.statTok": ["tokens \xB7 month", "Token \xB7 \u672C\u6708"],
  "adm.statFov": ["failovers 24h", "\u6545\u969C\u8F6C\u79FB \xB7 24h"],
  "adm.keys": ["API keys", "API Key"],
  "adm.keysHint": ["priority asc = first choice \xB7 budgets are monthly (USD)", "priority \u8D8A\u5C0F\u8D8A\u4F18\u5148 \xB7 \u9884\u7B97\u6309\u6708\uFF08\u7F8E\u5143\uFF09"],
  "adm.provider": ["provider", "Provider"],
  "adm.keyCol": ["key", "Key"],
  "adm.model": ["model", "\u6A21\u578B"],
  "adm.prio": ["prio", "\u4F18\u5148\u7EA7"],
  "adm.status": ["status", "\u72B6\u6001"],
  "adm.req": ["req \xB7 mo", "\u8BF7\u6C42 \xB7 \u6708"],
  "adm.tok": ["tokens \xB7 mo", "Token \xB7 \u6708"],
  "adm.cost": ["cost \xB7 mo", "\u6210\u672C \xB7 \u6708"],
  "adm.budget": ["budget", "\u9884\u7B97"],
  "adm.addTitle": ["Add key", "\u6DFB\u52A0 Key"],
  "adm.custom": ["custom\u2026", "\u81EA\u5B9A\u4E49\u2026"],
  "adm.baseUrl": ["base url (openai-compatible)", "Base URL\uFF08OpenAI \u517C\u5BB9\uFF09"],
  "adm.apikey": ["api key", "API Key"],
  "adm.budgetLabel": ["monthly budget \xB7 usd (0 = off)", "\u6708\u9884\u7B97 \xB7 \u7F8E\u5143\uFF080 = \u5173\u95ED\uFF09"],
  "adm.add": ["add key", "\u6DFB\u52A0 Key"],
  "adm.addHint": ["Encrypted with AES-256-GCM before it touches the disk. Only the last 4 chars are ever displayed.", "Key \u5728\u843D\u76D8\u524D\u4EE5 AES-256-GCM \u52A0\u5BC6\uFF0C\u754C\u9762\u53EA\u663E\u793A\u672B 4 \u4F4D\u3002"],
  "adm.test": ["test", "\u6D4B\u8BD5"],
  "adm.testing": ["testing\u2026", "\u6D4B\u8BD5\u4E2D\u2026"],
  "adm.enable": ["enable", "\u542F\u7528"],
  "adm.disable": ["disable", "\u505C\u7528"],
  "adm.remove": ["remove", "\u5220\u9664"],
  "adm.removeQ": ["remove this key?", "\u5220\u9664\u8BE5 Key\uFF1F"],
  "adm.log": ["Engine log", "\u5F15\u64CE\u65E5\u5FD7"],
  "adm.live": ["live \xB7 4s refresh", "\u5B9E\u65F6 \xB7 4 \u79D2\u5237\u65B0"],
  "adm.seo": ["SEO files", "SEO \u6587\u4EF6"],
  "adm.seoHint": ["served live at /robots.txt \xB7 /sitemap.xml \xB7 /llms.txt \xB7 /ai.txt \xB7 meta injected into the public pages", "\u5B9E\u65F6\u8F93\u51FA\u5230 /robots.txt \xB7 /sitemap.xml \xB7 /llms.txt \xB7 /ai.txt \xB7 meta \u6CE8\u5165\u516C\u5F00\u9875\u9762"],
  "adm.kb": ["Knowledge base", "\u77E5\u8BC6\u5E93"],
  "adm.kbHint": ["injected as the system prompt of every chat request", "\u4F5C\u4E3A system prompt \u6CE8\u5165\u6BCF\u4E00\u6B21\u804A\u5929\u8BF7\u6C42"],
  "adm.kbLabel": ["what the assistant knows about aeox \u2014 edit freely, save and it takes effect immediately", "\u52A9\u624B\u6240\u638C\u63E1\u7684 AEOX \u77E5\u8BC6 \u2014 \u81EA\u7531\u7F16\u8F91\uFF0C\u4FDD\u5B58\u540E\u7ACB\u5373\u751F\u6548"],
  "adm.kbNote": ["keep it under ~4000 chars \xB7 the assistant still answers general questions beyond this", "\u5EFA\u8BAE\u63A7\u5236\u5728 4000 \u5B57\u5185 \xB7 \u4E4B\u5916\u7684\u95EE\u9898\u52A9\u624B\u4ECD\u4F5C\u4E3A\u901A\u7528\u52A9\u624B\u56DE\u7B54"],
  "adm.robots": ["robots.txt", "robots.txt"],
  "adm.sitemap": ["sitemap.xml", "sitemap.xml"],
  "adm.llms": ["llms.txt \u2014 LLM site brief (markdown)", "llms.txt \u2014 LLM \u7AD9\u70B9\u8BF4\u660E\uFF08markdown\uFF09"],
  "adm.ai": ["ai.txt \u2014 AI agent brief (plain text)", "ai.txt \u2014 AI \u4EE3\u7406\u7B80\u62A5\uFF08\u7EAF\u6587\u672C\uFF09"],
  "adm.siteMeta": ["site meta", "\u7AD9\u70B9 meta"],
  "adm.titleEn": ["title \xB7 en", "\u6807\u9898 \xB7 \u82F1\u6587"],
  "adm.titleZh": ["title \xB7 zh", "\u6807\u9898 \xB7 \u4E2D\u6587"],
  "adm.descEn": ["description \xB7 en", "\u63CF\u8FF0 \xB7 \u82F1\u6587"],
  "adm.descZh": ["description \xB7 zh", "\u63CF\u8FF0 \xB7 \u4E2D\u6587"],
  "adm.save": ["save", "\u4FDD\u5B58"],
  "adm.saved": ["saved", "\u5DF2\u4FDD\u5B58"],
  "adm.reset": ["reset to default", "\u6062\u590D\u9ED8\u8BA4"],
  "adm.logout": ["logout", "\u767B\u51FA"],
  "adm.st.active": ["active", "\u53EF\u7528"],
  "adm.st.cooldown": ["cooldown", "\u51B7\u5374"],
  "adm.st.disabled": ["disabled", "\u5DF2\u7981\u7528"],
  "adm.st.budget": ["over budget", "\u8D85\u9884\u7B97"],
  "adm.st.nokey": ["standby", "\u5F85\u547D"],
  "adm.nokeyHint": ["add a key", "\u7B49\u5F85\u5F55\u5165 Key"],
  "adm.noauth": ["session expired \u2014 sign in again", "\u4F1A\u8BDD\u8FC7\u671F \u2014 \u8BF7\u91CD\u65B0\u767B\u5F55"],
  "adm.nokeys": ["no keys yet \u2014 add one below", "\u8FD8\u6CA1\u6709 Key \u2014 \u5728\u4E0B\u65B9\u6DFB\u52A0"]
};
function t(key) {
  const e = DICT[key];
  if (!e) return key;
  return lang === "zh" ? e[1] : e[0];
}
var listeners = [];
function applyStatic() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.getAttribute("data-i18n") ?? "");
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((node) => {
    node.placeholder = t(node.getAttribute("data-i18n-ph") ?? "");
  });
  document.querySelectorAll("[data-i18n-html]").forEach((node) => {
    node.innerHTML = t(node.getAttribute("data-i18n-html") ?? "");
  });
}
function setLang(l) {
  if (l === lang) return;
  lang = l;
  try {
    localStorage.setItem("aeox_lang", l);
  } catch {
  }
  document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  applyStatic();
  for (const fn of listeners) fn(l);
}
function initLangToggle(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const label = () => lang === "zh" ? "EN" : "\u4E2D\u6587";
  btn.textContent = label();
  btn.addEventListener("click", () => {
    setLang(lang === "zh" ? "en" : "zh");
    btn.textContent = label();
  });
}

// src/web/assets/door.ts
function initAdminDoor() {
  const ver = document.querySelector(".sb-ver");
  if (!ver) return;
  let clicks = 0;
  let timer = 0;
  ver.addEventListener("click", () => {
    clicks += 1;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      clicks = 0;
    }, 1200);
    if (clicks >= 3) {
      window.location.href = "/admin";
    }
  });
}

// src/web/assets/hub.ts
function byId(id) {
  return document.getElementById(id);
}
function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}
var status = null;
var spark = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var lastRouted = -1;
function dotColor(k) {
  if (k.status === "active") return "var(--up)";
  if (k.status === "cooldown") return "var(--warn)";
  return "var(--down)";
}
function renderKeys() {
  const box = byId("wKeys");
  box.innerHTML = "";
  if (!status) return;
  for (const k of status.keys) {
    const row = el("div", "w-key" + (k.status === "active" || k.status === "cooldown" ? "" : " off"));
    const dot = el("i");
    dot.style.background = dotColor(k);
    row.appendChild(dot);
    const name = el("span");
    name.textContent = k.label;
    row.appendChild(name);
    if (k.status === "cooldown") {
      const em = el("em");
      em.textContent = k.cooldown_s + "s";
      row.appendChild(em);
    } else if (k.status !== "active") {
      const em = el("em");
      em.textContent = t("eng.standby");
      row.appendChild(em);
    }
    box.appendChild(row);
  }
}
function renderSpark() {
  const box = byId("wSpark");
  box.innerHTML = "";
  for (const v of spark) {
    const bar = el("i");
    bar.style.height = Math.max(6, Math.min(100, v)) + "%";
    box.appendChild(bar);
  }
}
function render() {
  if (!status) return;
  byId("sbPool").textContent = status.totals.active + "/" + status.keys.length;
  byId("sbRouted").textContent = status.totals.requests_today.toLocaleString();
  byId("wRouted").textContent = status.totals.requests_today.toLocaleString();
  renderKeys();
  renderSpark();
}
async function poll() {
  try {
    const res = await fetch("/api/engine/status");
    if (res.ok) {
      status = await res.json();
      const routed = status.totals.requests_today;
      if (lastRouted >= 0) {
        spark.push(Math.min(100, (routed - lastRouted) * 25));
        spark.shift();
      }
      lastRouted = routed;
      render();
    }
  } catch {
  }
}
applyStatic();
initLangToggle("langBtn");
initAdminDoor();
byId("sbPool").textContent = "\u2014";
void poll();
window.setInterval(() => {
  void poll();
}, 2e3);
