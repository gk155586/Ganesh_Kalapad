const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbW9oemk0cTEwMDAwdXF3NG0zaGJzZmtkIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzc3NDI5ODUyLCJleHAiOjE3Nzc1MTYyNTJ9.aMVZwlPTWIgbkObc66ElagXBqCL08KmuiOFsI7HEAdQ";
const url = "http://localhost:3003";

async function main() {
  try {
    const res = await fetch(`${url}/api/cart/update`, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        productId: "some-product-id-123",
        quantity: 2
      })
    });
    console.log(`[${res.status}] /api/cart/update:`, await res.text());
  } catch (err) {
    console.error(`Error:`, err);
  }
}
main();
