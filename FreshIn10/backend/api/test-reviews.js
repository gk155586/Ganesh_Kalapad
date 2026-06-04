const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbW9oemk0cTEwMDAwdXF3NG0zaGJzZmtkIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzc3NDI5ODUyLCJleHAiOjE3Nzc1MTYyNTJ9.aMVZwlPTWIgbkObc66ElagXBqCL08KmuiOFsI7HEAdQ";
const url = "http://localhost:3003";

async function main() {
  try {
    const res = await fetch(`${url}/api/admin/reviews`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`[${res.status}] /api/admin/reviews:`, await res.text());

    const res2 = await fetch(`${url}/api/admin/reviews/delivery`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`[${res2.status}] /api/admin/reviews/delivery:`, await res2.text());
  } catch (err) {
    console.error(`Error:`, err);
  }
}
main();
