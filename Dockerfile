from node:6
add ./package.json /app/package.json
workdir /app/
run npm install
add . /app/
cmd npm run start
