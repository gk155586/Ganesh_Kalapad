const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbW9oemk0cTEwMDAwdXF3NG0zaGJzZmtkIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzc3NDI5ODUyLCJleHAiOjE3Nzc1MTYyNTJ9.aMVZwlPTWIgbkObc66ElagXBqCL08KmuiOFsI7HEAdQ";
const url = "http://localhost:3003";

async function test(path) {
  try {
    const res = await fetch(`${url}${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`[${res.status}] ${path}:`, await res.text());
  } catch (err) {
    console.error(`Error on ${path}:`, err);
  }
}

async function main() {
  await test("/api/cart");
  await test("/api/users/addresses");
  await test("/api/users/notifications");
}
main();
