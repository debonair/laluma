// Just a conceptual test to see if we can trigger the post error
curl -s -X POST http://localhost:3000/api/groups/non-existent/posts \
  -H "Authorization: Bearer mock" \
  -H "Content-Type: application/json" \
  -d '{"content": "test"}'
