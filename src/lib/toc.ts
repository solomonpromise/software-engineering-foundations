export type Entry = { label: string; title: string; page: number };
export type Part = { label: string; title: string; page: number; entries: Entry[] };

const raw = `
BEFORE|Before you begin|2
|About this book|2
|How each chapter is built|3
|How to use this book|4
|The roadmap|5
P1|Understanding Software Applications|9
01|What Software and Applications Are|10
02|Different Types of Applications|16
03|From a Problem to Application Requirements|23
04|The Software Development Lifecycle|30
✦|Project: Write your application brief|37
✦|Glossary|40
✦|Answers|42
P2|Understanding How Applications Work|45
05|Programming Foundations|46
06|The Frontend and User Interface|54
07|The Backend and Application Logic|60
08|Networks, HTTP and APIs|65
09|Databases and Persistent Storage|71
10|Modelling and Working with Data|77
11|Users, Authentication and Permissions|84
12|Following an Action Through the Application|91
✦|Project: Trace and diagram your application|96
✦|Glossary|98
✦|Answers|100
P3|Understanding the Project|103
13|Files, Folders and Project Structure|104
14|Repositories and Where They Live|110
15|Working with Git and Other Contributors|115
16|Development Environments and Dependencies|121
17|Configuration, Environment Variables and Secrets|127
18|Reading and Documenting a Project|132
✦|Project: Set up, explain and change the project|138
✦|Glossary|140
✦|Answers|142
P4|System Design and Architectural Decisions|145
19|Turning Requirements into a Design|146
20|Application Architecture and Boundaries|151
21|Choosing Languages, Frameworks and Services|156
22|Designing Data and Integrations|161
23|Designing for Quality and Future Change|167
✦|Project: Produce a design pack|173
✦|Glossary|175
✦|Answers|177
P5|Building Software with AI|180
24|Understanding AI Coding Tools|181
25|Preparing Tasks and Giving AI Context|186
26|Building Features in Small Increments|191
27|Understanding and Reviewing Generated Code|196
28|Testing and Verifying Behaviour|202
29|Debugging and Refining with AI|208
✦|Project: Build and verify the first useful version|213
✦|Glossary|215
✦|Answers|216
P6|Shipping and Maintaining Software|219
30|Understanding Deployment and Hosting|220
31|Preparing and Releasing an Application|225
32|Observing an Application in Production|230
33|Protecting Data and Recovering from Failure|235
34|Maintaining and Evolving the Application|240
✦|Project: Deploy and write a maintenance guide|245
✦|Glossary|247
✦|Answers|248
A–F|Appendices|251
A|A guide to common project files|251
B|Git and terminal reference|253
C|HTTP, API and SQL reference|255
D|Templates|256
E|Checklists|257
F|Further study|258
✦|Bibliography|259`;

export const TOTAL_PAGES = 262;

export const parts: Part[] = (() => {
  const out: Part[] = [];
  for (const line of raw.trim().split("\n")) {
    const [label = "", title = "", p = "1"] = line.split("|");
    const page = Number(p);
    if (/^(P\d|BEFORE|A–F)$/.test(label)) out.push({ label, title, page, entries: [] });
    else out[out.length - 1]!.entries.push({ label, title, page });
  }
  return out;
})();

export function sectionFor(page: number) {
  let cur: { part: Part; entry?: Entry } = { part: parts[0]! };
  for (const part of parts) {
    if (page >= part.page) cur = { part };
    for (const e of part.entries) if (page >= e.page && page >= part.page) cur = { part, entry: e };
  }
  return cur;
}
