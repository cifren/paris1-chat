import {config} from '../config.js'
import React from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import MsgBox from './msgbox/MsgBox.jsx';
import ChatBox from './chatbox/ChatBox.jsx';

class Chat extends React.Component {

  constructor(){
    super();
    this.state = {
      directionList: {},
      favList: {},
      searchList: {},
      searchState: false,
      activeRooms: {},
      user: {status: 'offline'}
    };
    this.socketManager = this.socketManager.bind(this);
    this.setStatus = this.setStatus.bind(this);
    this.socketEventListener = this.socketEventListener.bind(this);
    this.disconnectUser = this.disconnectUser.bind(this);
    this.connectUser = this.connectUser.bind(this);
    this.loadMsgBox = this.loadMsgBox.bind(this);
    this.manageFavList = this.manageFavList.bind(this);
    this.changeSearchState = this.changeSearchState.bind(this);
    this.updateSearchList = this.updateSearchList.bind(this);
    this.closeRoom = this.closeRoom.bind(this);
    this.minimizeRoom = this.minimizeRoom.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
  }

  connectToServer(){
    return io.connect(config.server_uri, {reconnect: true});
  }

  componentDidMount() {
    // DOM events
    window.addEventListener('connect_button', this.socketManager);
    window.addEventListener('dropdown_status', this.setStatus);
    window.addEventListener('user_button', this.loadMsgBox);
    window.addEventListener('fav_button', this.manageFavList);
    window.addEventListener('search_focus', this.changeSearchState);
    window.addEventListener('search_blur', this.changeSearchState);
    window.addEventListener('search_keypress', this.updateSearchList);
    window.addEventListener('close_room', this.closeRoom);
    window.addEventListener('minimize_room', this.minimizeRoom);
    window.addEventListener('send_message', this.sendMessage);
    window.addEventListener('upload_file', this.uploadFile);
  }

  socketManager(){
    if (this.state.user.status === 'offline'){
      this.socket = this.connectToServer();
      this.socketEventListener();
      this.socket.emit('join', function (data) {
        let recv = JSON.parse(data);
        if (recv.login === 'successful')
          this.setState({user: recv.user_props});
      }.bind(this));
    }
    else {
      this.socket.disconnect();
    }
  }

  socketEventListener(){
    this.socket.on('custom_error', function(recv){
      alert(recv.message);
    });
    this.socket.on('disconnect', function(){
      this.setState({
        user: {status: 'offline'},
        directionList: {},
        favList: {},
        activeRooms: {}
      });
    }.bind(this));
    this.socket.on('chat', function(data){
      let recv = JSON.parse(data);
      switch (recv.action){
        case 'direction_list':
          this.setState({directionList: recv.data});
          console.log(this.state.directionList);
          break;
        case 'fav_list':
          console.log('favlist : ' + recv.data);
          this.setState({favList: recv.data});
          break;
        case 'new_user':
          this.connectUser(recv.user);
          break;
        case 'user_typing':
          break;
        case 'user_change_status':
          break
        case 'message':
          break
        case 'user_disconnected':
          this.disconnectUser(recv.user);
          break;
      }
    }.bind(this));
  }

  setStatus(event){
    this.socket.emit('user_status', event.detail);
    this.setState({user: {status: event.detail}});
  }

  connectUser(user){
    if (this.state.user.uid != user.uid){
      this.state.directionList[user.uid] = user;
      this.setState({directionList: this.state.directionList});
    }
    if (this.state.favList[user.uid]){
      this.state.favList[user.uid] = user;
      this.setState({favList: this.state.favList});
    }
  }

  disconnectUser(user){
    if (this.state.directionList[user.uid]){
      delete this.state.directionList[user.uid];
      this.setState({directionList: this.state.directionList});
    }
    if (this.state.favList[user.uid]){
      this.state.favList[user.uid].status = 'offline';
      this.setState({favList: this.state.favList});
    }
    Object.keys(this.state.activeRooms).map((room) => {
      if (user.uid === this.state.activeRooms[room].penpal.uid){
        this.state.activeRooms[room].penpal.status = 'offline';
        this.setState({activeRooms: this.state.activeRooms});
      }
    });
  }

  loadMsgBox(event){
    let penpal = event.detail;
    this.socket.emit('load_room', [this.state.user.uid, penpal.uid].sort(), function(data){
      let room = JSON.parse(data);
      if (!this.state.activeRooms[room.room]){
        penpal.isFav = (this.state.favList[penpal.uid]) ? true : false;
        room.penpal = penpal;
        this.state.activeRooms[room.room] = room;
        this.setState({activeRooms: this.state.activeRooms});
      }
    }.bind(this));
  }

  manageFavList(event){
    let evtRoom = event.detail.room;
    let evtUser = event.detail.user;
    let action = (evtUser.isFav) ? 'del' : 'add';
    this.socket.emit('manage_fav_list', {action: action, user: evtUser.uid}, function(data){
      let recv = JSON.parse(data);
      if (recv.successful){
        let userDeleted = true
        recv.newFavList.map((favUser) => {
          if (favUser === evtUser.uid) userDeleted = false;
        });
        if (userDeleted){
          delete this.state.favList[evtUser.uid];
          this.state.activeRooms[evtRoom].penpal.isFav = false;

        }
        else {
          this.state.favList[evtUser.uid] = evtUser;
          this.state.activeRooms[evtRoom].penpal.isFav = true;
        }
        this.setState({
            favList: this.state.favList,
            activeRooms: this.state.activeRooms
        });
      }
    }.bind(this));
  }

  changeSearchState(event){
    let action = event.type;
    let newSearchState = (action === 'search_focus') ? true : false;
    this.setState({searchState: newSearchState});
  }

  updateSearchList(event){
    let search = event.detail.search;
    console.log(search);
    this.socket.emit('search', search, function(data){
      console.log(data);
      let recv = JSON.parse(data);
      if (recv.successful){
        this.setState({searchList: recv.users_found});
      }
    }.bind(this));
  }

  closeRoom(event){
    let roomId = event.detail.room;
    if (this.state.activeRooms[roomId]){
      delete this.state.activeRooms[roomId];
      this.setState({activeRooms: this.state.activeRooms});
    }
  }

  minimizeRoom(event){

  }

  sendMessage(){

  }

  uploadFile(){

  }

  render(){
    let activeRooms = Object.keys(this.state.activeRooms).map((room) => {
        return <MsgBox user={this.state.user} room={this.state.activeRooms[room]} key={room}/>
    });
    return (
      <div>
        <ChatBox user={this.state.user} directionList={this.state.directionList} favList={this.state.favList}
        searchState={this.state.searchState} searchList={this.state.searchList} />
        {activeRooms}
      </div>
    )
  }
}

ReactDOM.render(<Chat />, document.getElementById('app'));

export default Chat;