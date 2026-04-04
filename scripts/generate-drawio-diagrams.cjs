const fs = require("fs");
const path = require("path");

const root = "e:/CODES/GitHub Repos/EvalEase";
const outDir = path.join(root, "docs", "diagrams-drawio");

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

class DrawioBuilder {
  constructor(title) {
    this.title = title;
    this.cells = [
      '<mxCell id="0"/>',
      '<mxCell id="1" parent="0"/>'
    ];
    this.nextId = 2;
  }

  v(value, x, y, w, h, style = "rounded=1;whiteSpace=wrap;html=1;") {
    const id = String(this.nextId++);
    this.cells.push(
      `<mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`
    );
    return id;
  }

  e(value, source, target, style = "endArrow=block;html=1;rounded=0;") {
    const id = String(this.nextId++);
    this.cells.push(
      `<mxCell id="${id}" value="${esc(value)}" style="${style}" edge="1" parent="1" source="${source}" target="${target}"><mxGeometry relative="1" as="geometry"/></mxCell>`
    );
    return id;
  }

  actor(name, x, y) {
    return this.v(name, x, y, 90, 60, "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;");
  }

  usecase(name, x, y) {
    return this.v(name, x, y, 180, 60, "ellipse;whiteSpace=wrap;html=1;");
  }

  umlClass(name, x, y, w = 240, h = 170) {
    return this.v(name, x, y, w, h, "shape=umlClass;align=left;verticalAlign=top;spacingLeft=8;whiteSpace=wrap;html=1;");
  }

  umlPackage(name, x, y, w = 220, h = 110) {
    return this.v(name, x, y, w, h, "shape=folder;tabWidth=60;tabHeight=20;tabPosition=left;whiteSpace=wrap;html=1;");
  }

  umlNode(name, x, y, w = 280, h = 140) {
    return this.v(name, x, y, w, h, "shape=cube;size=14;whiteSpace=wrap;html=1;");
  }

  dfdProcess(name, x, y, w = 220, h = 80) {
    return this.v(name, x, y, w, h, "ellipse;whiteSpace=wrap;html=1;");
  }

  dfdExternal(name, x, y, w = 180, h = 90) {
    return this.v(name, x, y, w, h, "rounded=0;whiteSpace=wrap;html=1;");
  }

  erEntity(name, x, y, w = 220, h = 120) {
    return this.v(name, x, y, w, h, "shape=table;startSize=30;container=1;collapsible=0;whiteSpace=wrap;html=1;");
  }

  erRelation(name, x, y, w = 180, h = 90) {
    return this.v(name, x, y, w, h, "rhombus;whiteSpace=wrap;html=1;");
  }

  diamond(name, x, y) {
    return this.v(name, x, y, 180, 90, "rhombus;whiteSpace=wrap;html=1;");
  }

  datastore(name, x, y, w = 190, h = 70) {
    return this.v(name, x, y, w, h, "shape=datastore;whiteSpace=wrap;html=1;");
  }

  fileXml() {
    const modified = new Date().toISOString();
    const inner = `<mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2200" pageHeight="1400" math="0" shadow="0"><root>${this.cells.join("")}</root></mxGraphModel>`;
    return `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" modified="${modified}" agent="GPT-5.3-Codex" version="24.7.17" type="device" compressed="false"><diagram id="${Date.now()}" name="${esc(this.title)}">${inner}</diagram></mxfile>`;
  }
}

function writeDiagram(fileName, title, buildFn) {
  const b = new DrawioBuilder(title);
  buildFn(b);
  fs.writeFileSync(path.join(outDir, fileName), b.fileXml(), "utf8");
}

fs.mkdirSync(outDir, { recursive: true });

writeDiagram("01-use-case-diagram.drawio", "Use Case Diagram", (b) => {
  const admin = b.actor("Admin", 40, 250);
  const jury = b.actor("Jury", 980, 250);
  const boundary = b.v("EvalEase System", 180, 120, 760, 360, "swimlane;startSize=28;rounded=0;whiteSpace=wrap;html=1;dashed=1;");
  const login = b.usecase("Login", 260, 170);
  const manageSession = b.usecase("Manage Session", 260, 250);
  const manageData = b.usecase("Manage Jury/Teams", 260, 330);
  const score = b.usecase("Score Team", 610, 170);
  const lock = b.usecase("Lock Marks", 610, 250);
  const reports = b.usecase("View/Export Reports", 610, 330);
  b.e("", admin, login, "endArrow=none;html=1;");
  b.e("", admin, manageSession, "endArrow=none;html=1;");
  b.e("", admin, manageData, "endArrow=none;html=1;");
  b.e("", admin, reports, "endArrow=none;html=1;");
  b.e("", jury, login, "endArrow=none;html=1;");
  b.e("", jury, score, "endArrow=none;html=1;");
  b.e("", jury, lock, "endArrow=none;html=1;");
  b.e("", jury, reports, "endArrow=none;html=1;");
  b.e("system boundary", boundary, manageSession, "dashed=1;endArrow=none;html=1;");
});

writeDiagram("02-use-case-scenarios.drawio", "Use Case Scenarios", (b) => {
  b.v("UC-01 Start Session\nActor: Admin\nPre: Jury assigned\nMain: Start session\nPost: Ongoing for jury", 40, 40, 460, 180);
  b.v("UC-02 Submit Marks\nActor: Jury\nPre: Session active\nMain: Enter scores + submit\nPost: Mark saved/updated", 520, 40, 460, 180);
  b.v("UC-03 End Session\nActor: Admin\nPre: Session started\nMain: End + lock marks\nPost: Session closed", 1000, 40, 460, 180);
  b.v("UC-04 Shuffle Teams\nActor: Admin\nPre: Teams and jury exist\nMain: Shuffle assignment\nPost: team.juryId redistributed", 40, 250, 460, 180);
  b.v("UC-05 Lock/Unlock Marks\nActor: Jury/Admin\nPre: Mark exists\nMain: lockMarks/unlockMarks\nPost: Editability updated", 520, 250, 460, 180);
});

writeDiagram("03-class-diagram.drawio", "Class Diagram", (b) => {
  const session = b.umlClass("Session\n+id\n+name\n+startedAt\n+endedAt\n+isDraft", 40, 70);
  const jury = b.umlClass("Jury\n+id\n+name\n+email\n+phoneNumber\n+role", 310, 70);
  const jurySession = b.umlClass("JurySession\n+id\n+juryId\n+sessionId", 580, 70);
  const team = b.umlClass("Team\n+id\n+teamName\n+leaderId\n+juryId\n+room", 850, 70);
  const participant = b.umlClass("Participant\n+id\n+name\n+email\n+institution", 1120, 70);
  const teamMember = b.umlClass("TeamMember\n+id\n+teamId\n+memberId", 1390, 70);
  const mark = b.umlClass("Mark\n+id\n+teamId\n+juryId\n+session\n+scores\n+locked", 1660, 70, 240, 190);
  b.e("1..*", session, jurySession);
  b.e("1..*", jury, jurySession);
  b.e("1..*", jury, team);
  b.e("1..*", participant, team, "endArrow=block;html=1;dashed=1;");
  b.e("1..*", team, teamMember);
  b.e("1..*", participant, teamMember);
  b.e("1..*", team, mark);
  b.e("1..*", jury, mark);
  b.e("1..*", session, mark);
});

writeDiagram("04-sequence-diagram.drawio", "Sequence Diagram", (b) => {
  const ui = b.v("Jury UI", 40, 20, 140, 70, "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;");
  const action = b.v("marks.ts", 270, 20, 140, 70, "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;");
  const sessionUtils = b.v("sessionUtils", 500, 20, 160, 70, "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;");
  const marksUtils = b.v("marksUtils", 760, 20, 160, 70, "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;");
  const db = b.v("MySQL", 1020, 20, 140, 70, "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;");

  b.v("", 110, 100, 1, 420, "shape=line;strokeWidth=1;dashed=1;");
  b.v("", 340, 100, 1, 420, "shape=line;strokeWidth=1;dashed=1;");
  b.v("", 580, 100, 1, 420, "shape=line;strokeWidth=1;dashed=1;");
  b.v("", 840, 100, 1, 420, "shape=line;strokeWidth=1;dashed=1;");
  b.v("", 1090, 100, 1, 420, "shape=line;strokeWidth=1;dashed=1;");

  b.e("submitMarks(payload)", ui, action);
  b.e("getSessionById(session)", action, sessionUtils);
  b.e("SELECT sessions", sessionUtils, db);
  b.e("session", db, sessionUtils);
  b.e("getMarks(team,jury,session)", action, marksUtils);
  b.e("SELECT marks", marksUtils, db);
  b.e("create/update mark", action, marksUtils);
  b.e("INSERT/UPDATE", marksUtils, db);
  b.e("success + revalidate", action, ui);
});

writeDiagram("05-activity-diagram.drawio", "Activity Diagram", (b) => {
  const start = b.v("", 40, 130, 26, 26, "ellipse;whiteSpace=wrap;html=1;fillColor=#000000;strokeColor=#000000;");
  const c1 = b.v("Create Session", 120, 110, 180, 70, "rounded=1;whiteSpace=wrap;html=1;");
  const c2 = b.v("Assign Jury", 360, 110, 180, 70, "rounded=1;whiteSpace=wrap;html=1;");
  const c3 = b.v("Assign/Shuffle Teams", 600, 110, 200, 70, "rounded=1;whiteSpace=wrap;html=1;");
  const c4 = b.v("Start Session", 860, 110, 180, 70, "rounded=1;whiteSpace=wrap;html=1;");
  const d1 = b.diamond("Session Ended?", 1240, 100);
  const c5 = b.v("Lock Marks", 1480, 110, 170, 70, "rounded=1;whiteSpace=wrap;html=1;");
  const endOuter = b.v("", 1700, 125, 28, 28, "ellipse;whiteSpace=wrap;html=1;strokeWidth=2;");
  const end = b.v("", 1707, 132, 14, 14, "ellipse;whiteSpace=wrap;html=1;fillColor=#000000;strokeColor=#000000;");
  b.e("", start, c1);
  b.e("", c1, c2);
  b.e("", c2, c3);
  b.e("", c3, c4);
  b.e("", c4, d1);
  b.e("Yes", d1, c5);
  b.e("", c5, endOuter);
  b.e("No", d1, c4, "dashed=1;endArrow=block;html=1;");
});

writeDiagram("06-collaboration-diagram.drawio", "Collaboration Diagram", (b) => {
  b.v("Presentation Layer", 40, 40, 420, 500, "swimlane;startSize=28;rounded=1;whiteSpace=wrap;html=1;fillColor=#edf4ff;strokeColor=#6c8ebf;");
  b.v("Application Layer", 490, 40, 430, 500, "swimlane;startSize=28;rounded=1;whiteSpace=wrap;html=1;fillColor=#eafaf1;strokeColor=#82b366;");
  b.v("Data Layer", 950, 40, 360, 500, "swimlane;startSize=28;rounded=1;whiteSpace=wrap;html=1;fillColor=#fff3e8;strokeColor=#d79b00;");

  const jurySessionsView = b.v("JurySessionsView", 80, 110, 170, 64, "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;");
  const sessionTeamsView = b.v("SessionTeamsView", 280, 110, 160, 64, "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;");
  const marksDialog = b.v("marks-dialog", 180, 240, 170, 64, "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;");
  const revalidateUi = b.v("Dashboard/Home Refresh", 140, 370, 240, 64, "rounded=1;dashed=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;");

  const marksAction = b.v("actions/marks.ts", 540, 110, 170, 64, "rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;");
  const sessionAction = b.v("actions/sessionActions.ts", 730, 110, 170, 64, "rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;");
  const marksUtils = b.v("db/utils/marksUtils", 560, 260, 170, 64, "rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;");
  const sessionUtils = b.v("db/utils/sessionUtils", 740, 260, 170, 64, "rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;");

  const schema = b.v("Drizzle Schema", 990, 120, 140, 64, "shape=folder;tabWidth=50;tabHeight=16;tabPosition=left;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;");
  const mysql = b.v("MySQL", 1160, 110, 120, 70, "shape=cylinder;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;");
  const cache = b.v("Path Cache", 1020, 260, 120, 64, "shape=datastore;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;");

  b.e("1: Open assigned session", jurySessionsView, sessionTeamsView, "endArrow=block;html=1;rounded=1;");
  b.e("2: Add/Edit marks", sessionTeamsView, marksDialog, "endArrow=block;html=1;rounded=1;");
  b.e("3: submitMarks(payload)", marksDialog, marksAction, "strokeWidth=1.2;endArrow=block;html=1;rounded=1;");
  b.e("4: validate session", marksAction, sessionUtils, "endArrow=block;html=1;rounded=1;");
  b.e("5: read/write mark", marksAction, marksUtils, "endArrow=block;html=1;rounded=1;");
  b.e("6: uses table model", marksUtils, schema, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("7: SQL query/update", marksUtils, mysql, "strokeWidth=1.2;endArrow=block;html=1;rounded=1;");
  b.e("8: lockAllMarksForSession", sessionAction, sessionUtils, "endArrow=block;html=1;rounded=1;");
  b.e("9: revalidatePath", marksAction, cache, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("10: refreshed state", cache, revalidateUi, "endArrow=open;html=1;rounded=1;dashed=1;");
});

writeDiagram("07-package-diagram.drawio", "Package Diagram", (b) => {
  b.v("Presentation", 40, 40, 460, 420, "swimlane;startSize=28;rounded=1;whiteSpace=wrap;html=1;fillColor=#edf4ff;strokeColor=#6c8ebf;");
  b.v("Application", 530, 40, 470, 420, "swimlane;startSize=28;rounded=1;whiteSpace=wrap;html=1;fillColor=#eafaf1;strokeColor=#82b366;");
  b.v("Data & Platform", 1030, 40, 520, 420, "swimlane;startSize=28;rounded=1;whiteSpace=wrap;html=1;fillColor=#fff3e8;strokeColor=#d79b00;");

  const app = b.umlPackage("src/app\n(routes, layouts)", 80, 100, 190, 90);
  const components = b.umlPackage("src/components\n(UI, dialogs, tables)", 290, 100, 200, 90);
  const hooks = b.umlPackage("src/hooks\n(client hooks)", 140, 240, 170, 90);
  const middleware = b.umlPackage("src/middleware.ts", 330, 240, 160, 90);

  const actions = b.umlPackage("src/actions\n(server actions)", 570, 100, 190, 90);
  const zod = b.umlPackage("src/zod\n(validation schemas)", 780, 100, 190, 90);
  const authLib = b.umlPackage("src/lib\n(auth, guards)", 570, 240, 190, 90);
  const types = b.umlPackage("src/types\n(shared types)", 780, 240, 190, 90);

  const dbUtils = b.umlPackage("src/db/utils\n(query layer)", 1070, 100, 190, 90);
  const schema = b.umlPackage("src/db/schema\nDrizzle tables", 1280, 100, 190, 90);
  const scripts = b.umlPackage("scripts\nseed/migration", 1070, 240, 190, 90);
  const infra = b.umlPackage("docker-compose\nDockerfile", 1280, 240, 190, 90);

  b.e("render + route", app, components);
  b.e("state helpers", components, hooks);
  b.e("submit / fetch", components, actions);
  b.e("edge protection", app, middleware, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("role checks", middleware, authLib);
  b.e("validate", actions, zod);
  b.e("authorize", actions, authLib);
  b.e("DTO contracts", actions, types, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("query", actions, dbUtils);
  b.e("table mapping", dbUtils, schema);
  b.e("shared model", scripts, schema, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("runtime env", infra, app, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("db env", infra, dbUtils, "endArrow=block;html=1;rounded=1;dashed=1;");
});

writeDiagram("08-deployment-diagram.drawio", "Deployment Diagram", (b) => {
  b.v("User Environment", 40, 40, 300, 420, "swimlane;startSize=28;rounded=1;whiteSpace=wrap;html=1;fillColor=#edf4ff;strokeColor=#6c8ebf;");
  b.v("Docker Host / Runtime", 370, 40, 1160, 420, "swimlane;startSize=28;rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;");

  const client = b.umlNode("Client Device\nBrowser", 80, 120, 220, 110);
  const adminClient = b.umlNode("Admin Browser\nDashboard", 80, 280, 220, 110);

  const reverseProxy = b.umlNode("Ingress\nNext.js HTTP Endpoint", 430, 90, 250, 110);
  const app = b.umlNode("Container: evalease-app\nNext.js + Server Actions\nAuth + API + UI SSR", 720, 80, 340, 150);
  const cache = b.v("Next.js Cache/Revalidation", 1090, 100, 210, 90, "shape=datastore;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;");

  const mysql = b.umlNode("Container: evalease-mysql\nMySQL 8.0", 720, 270, 300, 130);
  const volume = b.v("Volume: mysql_data", 1060, 300, 240, 80, "shape=cylinder;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;");
  const seedData = b.v("Mounted Data\n/data (CSV/Excel)", 430, 280, 240, 90, "shape=folder;tabWidth=50;tabHeight=16;tabPosition=left;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;");

  b.e("HTTPS", client, reverseProxy, "strokeWidth=1.3;endArrow=block;html=1;rounded=1;");
  b.e("HTTPS", adminClient, reverseProxy, "strokeWidth=1.3;endArrow=block;html=1;rounded=1;");
  b.e("route request", reverseProxy, app, "endArrow=block;html=1;rounded=1;");
  b.e("revalidatePath", app, cache, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("DB TCP 3306", app, mysql, "strokeWidth=1.3;endArrow=block;html=1;rounded=1;");
  b.e("persistent storage", mysql, volume, "endArrow=block;html=1;rounded=1;");
  b.e("imports/seed", seedData, app, "endArrow=block;html=1;rounded=1;dashed=1;");
});

writeDiagram("09-dfd-level-0.drawio", "DFD Level 0", (b) => {
  b.v("DFD Level 0 (Context)", 40, 20, 1260, 40, "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;html=1;fontStyle=1;fontSize=18;");

  const admin = b.dfdExternal("Admin", 80, 180, 180, 90);
  const jury = b.dfdExternal("Jury", 1080, 180, 180, 90);

  const system = b.dfdProcess("P0: EvalEase Evaluation\nManagement System", 480, 150, 380, 150);

  b.e("Session setup\nJury assignment\nTeam mapping", admin, system, "endArrow=block;html=1;rounded=1;strokeWidth=1.2;");
  b.e("Dashboards\nSummary reports\nExport files", system, admin, "endArrow=block;html=1;rounded=1;strokeWidth=1.2;");

  b.e("Assigned sessions\nTeams to evaluate", system, jury, "endArrow=block;html=1;rounded=1;strokeWidth=1.2;");
  b.e("Scores + lock status", jury, system, "endArrow=block;html=1;rounded=1;strokeWidth=1.2;");
});

writeDiagram("10-dfd-level-1.drawio", "DFD Level 1", (b) => {
  b.v("DFD Level 1", 40, 20, 1480, 40, "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;html=1;fontStyle=1;fontSize=18;");

  const admin = b.dfdExternal("Admin", 60, 130, 150, 80);
  const jury = b.dfdExternal("Jury", 60, 260, 150, 80);

  const p1 = b.dfdProcess("1.0 Authentication\n& Authorization", 280, 70, 230, 80);
  const p2 = b.dfdProcess("2.0 Session\nManagement", 560, 70, 220, 80);
  const p3 = b.dfdProcess("3.0 Team/Jury\nAssignment", 830, 70, 230, 80);
  const p4 = b.dfdProcess("4.0 Evaluation &\nMarks Processing", 1110, 70, 260, 80);
  const p5 = b.dfdProcess("5.0 Reporting\n& Export", 560, 220, 220, 80);
  const p6 = b.dfdProcess("6.0 Session Status\nView", 830, 220, 230, 80);

  const d1 = b.datastore("D1 Credentials", 320, 380, 180, 70);
  const d2 = b.datastore("D2 Sessions", 520, 380, 180, 70);
  const d3 = b.datastore("D3 Jury", 720, 380, 170, 70);
  const d4 = b.datastore("D4 Teams", 910, 380, 170, 70);
  const d5 = b.datastore("D5 Team Members", 1100, 380, 190, 70);
  const d6 = b.datastore("D6 Marks", 1310, 380, 170, 70);

  b.e("login request", admin, p1, "endArrow=block;html=1;rounded=1;");
  b.e("jury login", jury, p1, "endArrow=block;html=1;rounded=1;");
  b.e("auth result", p1, admin, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("auth result", p1, jury, "endArrow=block;html=1;rounded=1;dashed=1;");

  b.e("create/start/end", admin, p2, "endArrow=block;html=1;rounded=1;");
  b.e("assign/reassign", admin, p3, "endArrow=block;html=1;rounded=1;");
  b.e("assigned teams", p3, jury, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("score payload", jury, p4, "endArrow=block;html=1;rounded=1;");
  b.e("reports request", admin, p5, "endArrow=block;html=1;rounded=1;");
  b.e("status request", jury, p6, "endArrow=block;html=1;rounded=1;dashed=1;");

  b.e("verify credentials", p1, d1, "endArrow=block;html=1;rounded=1;");
  b.e("session lifecycle", p2, d2, "endArrow=block;html=1;rounded=1;");
  b.e("jury data", p3, d3, "endArrow=block;html=1;rounded=1;");
  b.e("team mapping", p3, d4, "endArrow=block;html=1;rounded=1;");
  b.e("store marks", p4, d6, "endArrow=block;html=1;rounded=1;");
  b.e("validate session", p4, d2, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("team lookup", p4, d4, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("team member data", p6, d5, "endArrow=block;html=1;rounded=1;");
  b.e("aggregate", p5, d6, "endArrow=block;html=1;rounded=1;");
  b.e("session context", p5, d2, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("team member list", p5, d5, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("export/report output", p5, admin, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("session summary", p6, jury, "endArrow=block;html=1;rounded=1;dashed=1;");
});

writeDiagram("11-dfd-level-2.drawio", "DFD Level 2 (Marks Processing)", (b) => {
  b.v("DFD Level 2 - Process 4.0 Evaluation & Marks", 40, 20, 1660, 40, "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;html=1;fontStyle=1;fontSize=18;");

  const admin = b.dfdExternal("Admin", 60, 150, 160, 80);
  const jury = b.dfdExternal("Jury", 60, 290, 160, 80);

  const s1 = b.dfdProcess("4.1 Validate\nSession Access", 300, 70, 210, 80);
  const s2 = b.dfdProcess("4.2 Fetch Assigned\nTeams", 560, 70, 210, 80);
  const s3 = b.dfdProcess("4.3 Capture Score\nInput", 820, 70, 210, 80);
  const s4 = b.dfdProcess("4.4 Validate\nScore Rules", 1080, 70, 210, 80);
  const s5 = b.dfdProcess("4.5 Create/Update\nMarks", 1340, 70, 220, 80);

  const s6 = b.dfdProcess("4.6 Lock/Unlock\nWorkflow", 560, 220, 210, 80);
  const s7 = b.dfdProcess("4.7 Aggregate\nSession Summary", 820, 220, 210, 80);
  const s8 = b.dfdProcess("4.8 Publish Response\n& Revalidate", 1080, 220, 240, 80);

  const d2 = b.datastore("D2 Sessions", 320, 390, 180, 70);
  const d3 = b.datastore("D3 Jury", 520, 390, 170, 70);
  const d4 = b.datastore("D4 Teams", 710, 390, 170, 70);
  const d5 = b.datastore("D5 Team Members", 900, 390, 190, 70);
  const d6 = b.datastore("D6 Marks", 1110, 390, 170, 70);
  const d7 = b.datastore("D7 Reports View", 1300, 390, 190, 70);

  b.e("session control", admin, s1, "endArrow=block;html=1;rounded=1;");
  b.e("evaluate request", jury, s1, "endArrow=block;html=1;rounded=1;");

  b.e("valid context", s1, s2, "endArrow=block;html=1;rounded=1;");
  b.e("assigned team list", s2, s3, "endArrow=block;html=1;rounded=1;");
  b.e("scores", s3, s4, "endArrow=block;html=1;rounded=1;");
  b.e("valid scores", s4, s5, "endArrow=block;html=1;rounded=1;");
  b.e("lock decision", s5, s6, "endArrow=block;html=1;rounded=1;");
  b.e("summary data", s5, s7, "endArrow=block;html=1;rounded=1;");
  b.e("final payload", s7, s8, "endArrow=block;html=1;rounded=1;");
  b.e("final payload", s6, s8, "endArrow=block;html=1;rounded=1;");

  b.e("read state", s1, d2, "endArrow=block;html=1;rounded=1;");
  b.e("jury check", s1, d3, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("read assignments", s2, d4, "endArrow=block;html=1;rounded=1;");
  b.e("team member context", s2, d5, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("read existing", s5, d6, "endArrow=block;html=1;rounded=1;");
  b.e("write/update", s5, d6, "endArrow=block;html=1;rounded=1;strokeWidth=1.2;");
  b.e("set lock flag", s6, d6, "endArrow=block;html=1;rounded=1;");
  b.e("aggregate marks", s7, d6, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("write summary", s7, d7, "endArrow=block;html=1;rounded=1;");

  b.e("response", s8, jury, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("summary/report", s8, admin, "endArrow=block;html=1;rounded=1;dashed=1;");
  b.e("status response", s8, jury, "endArrow=block;html=1;rounded=1;dashed=1;");
});

writeDiagram("12-er-diagram.drawio", "ER Diagram", (b) => {
  const sessions = b.erEntity("sessions\nPK id\nname\nstartedAt\nendedAt", 40, 40, 230, 140);
  const jury = b.erEntity("jury\nPK id\nname\nemail\nphoneNumber", 340, 40, 230, 140);
  const jurySessions = b.erEntity("jury_sessions\nPK id\nFK juryId\nFK sessionId", 640, 40, 260, 140);
  const teams = b.erEntity("teams\nPK id\nFK juryId\nFK leaderId\nteamName", 40, 260, 250, 150);
  const participants = b.erEntity("participants\nPK id\nname\nemail", 360, 260, 230, 130);
  const teamMembers = b.erEntity("team_members\nPK id\nFK teamId\nFK memberId", 650, 260, 260, 140);
  const marks = b.erEntity("marks\nPK id\nFK teamId\nFK juryId\nFK session\nlocked", 980, 140, 260, 170);

  const rSj = b.erRelation("assigned_to", 500, 200, 180, 90);
  const rTm = b.erRelation("has_member", 500, 420, 180, 90);
  const rMk = b.erRelation("evaluates", 920, 360, 180, 90);

  b.e("1", sessions, jurySessions, "startArrow=ERone;endArrow=ERmany;edgeStyle=entityRelationEdgeStyle;html=1;");
  b.e("1", jury, jurySessions, "startArrow=ERone;endArrow=ERmany;edgeStyle=entityRelationEdgeStyle;html=1;");
  b.e("", teams, rTm, "endArrow=none;html=1;");
  b.e("", participants, rTm, "endArrow=none;html=1;");
  b.e("", sessions, rSj, "endArrow=none;html=1;");
  b.e("", jury, rSj, "endArrow=none;html=1;");
  b.e("", teams, rMk, "endArrow=none;html=1;");
  b.e("", jury, rMk, "endArrow=none;html=1;");
  b.e("", sessions, marks, "startArrow=ERone;endArrow=ERmany;edgeStyle=entityRelationEdgeStyle;html=1;");
  b.e("", jury, marks, "startArrow=ERone;endArrow=ERmany;edgeStyle=entityRelationEdgeStyle;html=1;");
  b.e("", teams, marks, "startArrow=ERone;endArrow=ERmany;edgeStyle=entityRelationEdgeStyle;html=1;");
});

const readme = [
  "# Draw.io Diagram Files",
  "",
  "Generated draw.io diagrams for EvalEase:",
  "",
  "- 01-use-case-diagram.drawio",
  "- 02-use-case-scenarios.drawio",
  "- 03-class-diagram.drawio",
  "- 04-sequence-diagram.drawio",
  "- 05-activity-diagram.drawio",
  "- 06-collaboration-diagram.drawio",
  "- 07-package-diagram.drawio",
  "- 08-deployment-diagram.drawio",
  "- 09-dfd-level-0.drawio",
  "- 10-dfd-level-1.drawio",
  "- 11-dfd-level-2.drawio",
  "- 12-er-diagram.drawio",
  "",
  "These files open directly in the VS Code draw.io extension.",
].join("\n");

fs.writeFileSync(path.join(outDir, "README.md"), readme, "utf8");
console.log(`Generated 12 .drawio files in ${outDir}`);
