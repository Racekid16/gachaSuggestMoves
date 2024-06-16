/*
Must have 1.server.js running
Instructions:
1. have you or someone else put the character whose image you want to read into slot 1 of their party
2. start the server with $ node 1.server.js
3. copy this entire script and paste it into chrome's developer console
4. run /party (and make sure the party is the bottommost one on your screen)
5. run sendToServer("that character's name") in console
The character in the first slot of the party at the bottom of your screen will be added to the database
so that it can be recognized in the future.
*/

delay = async (ms = 1000) =>  new Promise(resolve => setTimeout(resolve, ms));

async function sendToServer(charName) {
    images = document.getElementsByClassName('imageWrapper__152ac imageZoom__98d0c clickable__01fcd');
    imageURL = images[images.length - 1].children[0].getAttribute('data-safe-src')
        .replace(/width=\d+/, 'width=328').replace(/height=\d+/, 'height=254').replace('webp', 'png')
    await fetch("http://127.0.0.1:2700/ImageData/updateDb", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: charName,
            imageURL: imageURL
        })
    });
    console.log(`${charName}'s image data sent to the server!`);
}