# Tool Scope and Sound Fix Checklist

- [x] Confirm the two reported modules share one confusing encode/decode implementation.
- [x] Split URL and HTML work into four focused routes: URL Encode, URL Decode, HTML Encode, and HTML Decode.
- [x] Preserve local-only behavior and descriptive module copy for each route.
- [x] Add an explicit Sound On control so browser audio begins only after a user gesture.
- [x] Add short event sounds for game start, collecting a fragment, clearing a gate, and a collision.
- [x] Verify the routes, sound UI, TypeScript build, and browser console before checkpointing.
