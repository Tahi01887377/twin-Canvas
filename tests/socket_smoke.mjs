import { io } from "socket.io-client";

const url = "http://localhost:3001";
const create = await fetch(`${url}/api/rooms`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ ownerName: "DenoTest", width: 800, height: 600 }),
});
const { roomId } = await create.json();
console.log("CREATED", roomId);

const socket = io(url, { transports: ["websocket", "polling"] });
const timeout = setTimeout(() => {
  console.log("RESULT=FAIL timeout");
  Deno.exit(1);
}, 15000);

socket.on("connect", () => {
  console.log("CONNECTED", socket.id);
  socket.emit("join_room", {
    roomId,
    user: { id: "u1", name: "Alice", color: "#3b82f6", isOwner: true },
  });
});

socket.on("room_joined", (payload) => {
  console.log("ROOM_JOINED", JSON.stringify({ roomId: payload.roomId, users: payload.users.length, objects: Object.keys(payload.canvas.objects).length }));
  socket.emit("create_object", {
    roomId: payload.roomId,
    object: {
      id: "rect-1",
      type: "rect",
      x: 10, y: 20, width: 50, height: 50,
      fill: "#ff0000", stroke: "#000000", strokeWidth: 1, rx: 0, ry: 0,
      rotation: 0, scaleX: 1, scaleY: 1, originX: "left", originY: "top",
      opacity: 1, visible: true, selectable: true, evented: true, zIndex: 0,
      locked: false,
    },
  });
});

socket.on("room_error", (e) => {
  console.log("ROOM_ERROR", JSON.stringify(e));
});

setTimeout(() => {
  socket.emit("save_canvas", { roomId });
}, 500);

socket.on("canvas_saved", (p) => {
  console.log("SAVED", JSON.stringify(p));
  clearTimeout(timeout);
  socket.close();
  Deno.exit(0);
});