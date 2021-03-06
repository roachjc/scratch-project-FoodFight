const express = require('express');
const bodyParser = require('body-parser');
const yelpController = require('./util/yelpController');

const app = express();
const server = app.listen(3000);
const io = require('socket.io').listen(server);

app.use(express.static(`${__dirname}/www`));
app.use(bodyParser.urlencoded({ extended: true }));

let votes = [];
const count = {};
let users = [];
let topChoice = '';
let currentYelp = {};
let allCoords = [];

function getRank() {
  return Object.keys(count).sort((a, b) => {
    if (count[b].length > count[a].length) return 1;
    if (count[b].length < count[a].length) return -1;
    return 0;
  });
}
// listens for connect event when users join socket
io.on('connection', (socket) => {
  socket.emit('updateCount', count);
  socket.emit('updateYelp', currentYelp);
  // Add user to user list
  users.push(socket.id);
  console.log('Connected: %s users', users.length);

  // remove disconnected socket from user & cancel votes

  socket.on('disconnect', () => {
    const id = socket.id;
    users = users.filter(user => user !== id);
    const vote = votes ? votes.filter(thisVote => thisVote.id === id)[0] : null;
    console.log('vote after disconnect: ', vote)
    if (vote) {
      const choice = vote.choice;
      if (count[choice]) {
        count[choice] = count[choice].filter(countVote => countVote.id !== id);
        if (!count[choice].length) delete count[choice];
      }
      votes = votes.filter(keepVote => keepVote.id !== id);
      if (vote.coords) {
        allCoords = allCoords.filter(coords => coords.lat !== vote.coords[0]);
      }
    }
    yelpController
      .getData(topChoice, allCoords)
      .then((yelp) => {
        currentYelp = yelp;
        socket.emit('updateYelp', yelp);
        socket.broadcast.emit('updateYelp', yelp);
      });
    console.log('count after disconnect: ', count);
    console.log('coords after disconnect: ', allCoords);
    socket.emit('updateCount', count);
    socket.broadcast.emit('updateCount', count);
    socket.disconnect();
    console.log('Disconnected: %s users remaining', users.length);
  });

  socket.on('vote', (data) => {
    console.log('data sent on vote: ', data);
    const id = socket.id;
    const choice = data[0];
    const name = data[1] || 'anonymous';
    const coords = data[2];
    // add new coords to list
    
    // check if voter has already voted
    const existingVote = votes.filter(vote => vote.id === id)[0];
    if (existingVote) {
      // remove vote from count and votes
      const target = count[existingVote.choice].filter(voter => voter.id === id)[0]
      count[existingVote.choice].splice(count[existingVote.choice].indexOf(target), 1);
      if (!count[existingVote.choice].length) delete count[existingVote.choice];
      votes = votes.filter(vote => vote.id !== id);
      // Only push to coords if they have not already voted
    } else allCoords.push({ lat: coords[0], lng: coords[1] });
    // add new vote to count
    if (count[choice]) count[choice].push({ id, name });
    else (count[choice]) = [{ id, name }];

    console.log('votes: ', votes);
    console.log('allCoords: ', allCoords);

    const update = getRank()[0];
    if (update !== topChoice || allCoords.length !== votes.length) {
      topChoice = update;
      yelpController
        .getData(topChoice, allCoords)
        .then((yelp) => {
          currentYelp = yelp;
          socket.emit('updateYelp', yelp);
          socket.broadcast.emit('updateYelp', yelp);
        });
    } else {
      socket.emit('updateYelp', currentYelp);
      socket.broadcast.emit('updateYelp', currentYelp);
    }
    // console.log('count: ', count);
    // console.log('votes: ', votes);
    socket.emit('updateCount', count);
    socket.broadcast.emit('updateCount', count);
    socket.broadcast.emit('newVote', count);
    // add new vote to votes
    votes.push({ id, choice, coords });
  });
});

console.log('connected to server');

 // socket.emit('connected', { message: 'hello, we are connected' })
  // socket.emit('welcome', {
  //   count4Chinese: chineseCounter,
  //   count4Japanese: japaneseCounter,
  //   count4Mexican: mexicanCounter,
  //   count4Italian: italianCounter,
  // });


  // let chineseCounter = 0;
  // let japaneseCounter = 0;
  // let mexicanCounter = 0;
  // let italianCounter = 0;

  // if (Object.keys(votes).includes(id)) {
    //   const target = count[votes[id]].filter(voter => voter.id === id)[0];
    //   count[votes[id]].splice(count[votes[id]].indexOf(target), 1);
    //   if (!count[votes[id]].length) delete count[votes[id]];
    //   delete votes[id];
    // }

    // if (count[choice]) count[choice].push({ id, name });
    // else (count[choice]) = [{ id, name }];

    // votes[id] = choice;
