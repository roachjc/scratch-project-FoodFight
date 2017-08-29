import React from 'react';
import {render} from 'react-dom';
import io from 'socket.io-client';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import ActionFavorite from 'material-ui/svg-icons/action/favorite';
import ActionFavoriteBorder from 'material-ui/svg-icons/action/favorite-border';
import {Jumbotron} from 'react-bootstrap';
import FoodList from './food_list';

class Platform2 extends React.Component {
  constructor() {
    super();
    this.state = {
      options: []
    }
  }

  componentWillMount() {
    this.socket = io('http://localhost:3000');
    this.socket.on('connected', this.connected);
    this.socket.on('welcome', this.updateState);
    this.socket.on('updateCount', this.updateCount);
    this.socket.on('newVote', this.newVote);
  }

  emit = ((event, data) => {
    this.socket.emit(event, data);
  })

  vote = ((event) => {
    event.preventDefault();
    this.emit("vote", this.refs.foodtype.value);
  })

  newVote = ((event, food) => {
    event.preventDefault();
    this.emit("vote", food);
  })

  updateState = ((serverState) => {
    this.setState(serverState);
  })

  updateCount = ((choice) => {
    const state = Object.keys(choice).map((food) => {
      let options = {};
      options.name = food;
      options.votes = choice[food].length;
      options.voters = choice[food];
      return options;
    })

    this.setState({options: state});
  })

  connected = ((data) => {
    this.setState({name: data.name});
  })

  render() {
    const newFoodList = this.state.options.map((foodtype, i) =>
    <FoodList foodtype={foodtype.name} totalVotes={foodtype.votes} voters={foodtype.voters} position={i} newVote={this.newVote}/>)

    return (
      <div>
        <form onSubmit={this.vote}>
          Enter Food:
          <input type="text" ref="foodtype"/>
          <input type="button" value="Submit"/>
        </form>
        {newFoodList}
      </div>
    )
  }
}

const styles = {
  block: {
    maxWidth: 250
  },
  radioButton: {
    marginBottom: 16
  },
  contain: {
    wrapMargin: '30',
    padding: '50',
    backgroundImage: "url('http://www.nmgncp.com/data/out/124/4634171-food-wallpaper-background.jpg')"
  }
};

export default Platform2;