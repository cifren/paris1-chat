import config from './../config.js'
import React from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import MsgBox from './msgbox/MsgBox.jsx';
import ChatBox from './chatbox/ChatBox.jsx';
import DropUpMsgBox from './core/DropUpMsgBox.jsx';

class Chat extends React.Component {

  constructor(){
    super();
    this.state = {
      directionList: {},
      favList: {},
      searchList: {},
      searchState: false,
      activeRooms: {},
      user: {status: 'offline'},
      windowWidth: window.innerWidth,
      chatBox: {minimized: false}
    };
    this.closeChat = this.closeChat.bind(this);
    this.setStatus = this.setStatus.bind(this);
    this.socketEventListener = this.socketEventListener.bind(this);
    this.disconnectUser = this.disconnectUser.bind(this);
    this.connectUser = this.connectUser.bind(this);
    this.loadMsgBoxFromUser = this.loadMsgBoxFromUser.bind(this);
    this.loadMsgBoxFromRoom = this.loadMsgBoxFromRoom.bind(this);
    this.manageFavList = this.manageFavList.bind(this);
    this.updateSearchList = this.updateSearchList.bind(this);
    this.closeRoom = this.closeRoom.bind(this);
    this.minMaxBox = this.minMaxBox.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.changeStatusUser = this.changeStatusUser.bind(this);
    this.addMessageToRoom = this.addMessageToRoom.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.changeDisplayOrder = this.changeDisplayOrder.bind(this);

    this.connectToServer();

  }

  connectToServer(){
    this.socket = io.connect(config.server_uri, {reconnect: true});
    this.socketEventListener();
    this.socket.emit('join', function (data) {
      let recv = JSON.parse(data);
      if (recv.login === 'successful')
        this.setState({user: recv.user_props});
    }.bind(this));
  }

  closeChat(){
    this.socket.disconnect();
    document.getElementById('app').style.display = "none";
  }

  componentDidMount() {
    // DOM events
    window.addEventListener('disconnect', this.closeChat);
    window.addEventListener('change_status', this.setStatus);
    window.addEventListener('user_button', this.loadMsgBoxFromUser);
    window.addEventListener('fav_button', this.manageFavList);
    window.addEventListener('search_keypress', this.updateSearchList);
    window.addEventListener('close_room', this.closeRoom);
    window.addEventListener('min_max_box', this.minMaxBox);
    window.addEventListener('send_message', this.sendMessage);
    window.addEventListener('upload_file', this.uploadFile);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('change_display_order', this.changeDisplayOrder);
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
          break;
        case 'fav_list':
          this.setState({favList: recv.data});
          Object.keys(this.state.activeRooms).map((room) => {
            this.state.activeRooms[room].penpal.isFav = (this.state.favList[this.state.activeRooms[room].penpal.uid]) ? true : false;
          });
          this.setState({activeRooms: this.state.activeRooms});
          break;
        case 'new_user':
          this.connectUser(recv.user);
          break;
        case 'user_typing':
          break;
        case 'user_change_status':
          this.changeStatusUser(recv.user);
          break
        case 'message':
          this.addMessageToRoom(recv.data);
          break
        case 'user_disconnected':
          this.disconnectUser(recv.user);
          break;
      }
    }.bind(this));
  }

  setStatus(event){
    let newStatus = event.detail;
    if (this.state.user.status != newStatus){
      this.state.user.status = newStatus;
      this.setState({user: this.state.user})
      this.socket.emit('user_status', this.state.user);
    }
  }

  changeStatusUser(user){
    if (this.state.directionList[user.uid]){
      this.state.directionList[user.uid] = user;
      this.setState({directionList: this.state.directionList});
    }
    if (this.state.favList[user.uid]){
      this.state.favList[user.uid] = user;
      this.setState({favList: this.state.favList});
    }
    Object.keys(this.state.activeRooms).map((room) => {
      if (user.uid === this.state.activeRooms[room].penpal.uid){
        this.state.activeRooms[room].penpal.status = user.status;
        this.setState({activeRooms: this.state.activeRooms});
      }
    });
  }

  connectUser(user){
    if (this.state.user.uid !== user.uid && this.state.user.direction[0] === user.direction[0]){
      this.state.directionList[user.uid] = user;
      this.setState({directionList: this.state.directionList});
    }
    if (this.state.favList[user.uid]){
      this.state.favList[user.uid] = user;
      this.setState({favList: this.state.favList});
    }
    Object.keys(this.state.activeRooms).map((room) => {
      if (user.uid === this.state.activeRooms[room].penpal.uid){
        this.state.activeRooms[room].penpal.status = user.status;
        this.setState({activeRooms: this.state.activeRooms});
      }
    });
  }

  disconnectUser(user){
    if (this.state.user.uid === user.uid){
      this.socket.disconnect();
    }
    else {
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
  }

  loadMsgBoxFromUser(event){
    let penpal = event.detail;
    this.socket.emit('load_room_users', [this.state.user.uid, penpal.uid].sort(), function(data){
      let room = JSON.parse(data);
      if (!this.state.activeRooms[room.room]){
        penpal.isFav = (this.state.favList[penpal.uid]) ? true : false;
        room.penpal = penpal;
        this.state.activeRooms[room.room] = room;
        this.state.activeRooms[room.room].displayOrder = Object.keys(this.state.activeRooms).length;
        this.setState({activeRooms: this.state.activeRooms});
        this.scrollDivToBottom(room.room);
      }
      if (this.state.searchState){
        this.setState({searchState: false});
        document.getElementById('search').value = "";
      }
      document.getElementById(room.room).getElementsByClassName('input_text')[0].focus()
    }.bind(this));
  }

  manageFavList(event){
    let evtRoom = event.detail.room;
    let evtUser = event.detail.user;
    let action = (evtUser.isFav) ? 'del' : 'add';
    this.socket.emit('manage_fav_list', {action: action, user: evtUser.uid});
  }

  updateSearchList(event){
    let search = event.detail.search;
    let updateSearchState = (search.length === 0) ? false : true;
    if (this.state.searchState != updateSearchState) this.setState({searchState: updateSearchState});
    if (this.state.searchState){
      this.socket.emit('search', search, function(data){
        let recv = JSON.parse(data);
        if (recv.successful){
          this.setState({searchList: recv.users_found});
        }
      }.bind(this));
    }
  }

  closeRoom(event){
    let roomId = event.detail.room;
    if (this.state.activeRooms[roomId]){
      delete this.state.activeRooms[roomId];
      if (Object.keys(this.state.activeRooms).length > 0){
        Object.keys(this.state.activeRooms).map((room) => {
          if (this.state.activeRooms[room].displayOrder > 1){
            this.state.activeRooms[room].displayOrder -= 1;
          }
        });
      }
      this.setState({activeRooms: this.state.activeRooms});
    }
  }

  minMaxBox(event){
    let boxId = event.detail.box;
    if (boxId === "chatbox"){
      this.state.chatBox.minimized = (this.state.chatBox.minimized) ? false : true;
      this.setState({chatBox: this.state.chatBox});
    }
    else {
      this.state.activeRooms[boxId].minimized = (this.state.activeRooms[boxId].minimized) ? false : true;
      this.setState({activeRooms: this.state.activeRooms});
    }
  }

  sendMessage(event){
    let message = event.detail;
    message.text = message.text.substring(0, message.text.length - 1);
    this.socket.emit('send_message', message);
  }

  uploadFile(){

  }

  scrollDivToBottom(id){
    if (document.getElementById(id)){
      let div = document.getElementById(id).getElementsByClassName('panel-body')[0];
      div.scrollTop = div.scrollHeight;
    }
  }

  playNewMessageSound(message){
    if (message.owner !== this.state.user.uid){
      let audio = new Audio('./../sounds/popup.mp3');
      audio.play();
    }
  }

  loadMsgBoxFromRoom(message){
    let roomId = message.room;
    this.socket.emit('load_room_id', roomId, function(data){
      let room = JSON.parse(data);
      this.state.activeRooms[room.room] = room;
      this.state.activeRooms[room.room].penpal.isFav = (this.state.favList[this.state.activeRooms[room.room].penpal.uid]) ? true : false;
      this.state.activeRooms[room.room].displayOrder = Object.keys(this.state.activeRooms).length;
      this.setState({activeRooms: this.state.activeRooms});
      this.scrollDivToBottom(roomId);
      this.playNewMessageSound(message);
    }.bind(this));
  }

  addMessageToRoom(message){
    if (!this.state.activeRooms[message.room]){
      this.loadMsgBoxFromRoom(message);
    }
    else {
      this.state.activeRooms[message.room].messages.push(message);
      this.setState({activeRooms: this.state.activeRooms});
      this.scrollDivToBottom(message.room);
      this.playNewMessageSound(message);
    }
  }

  handleResize(){
    this.setState({windowWidth: window.innerWidth});
  }

  changeDisplayOrder(event){
    let roomId = event.detail;
    this.state.activeRooms[roomId].displayOrder = 1;
    Object.keys(this.state.activeRooms).map((room) => {
      if (room !== roomId){
        this.state.activeRooms[room].displayOrder += 1;
      }
    });
    this.setState({activeRooms: this.state.activeRooms});
  }

  render(){
    let hiddenRooms = {};
    let numDisplayableRooms = Math.floor(this.state.windowWidth / 300) - 1;
    let activeRooms = Object.keys(this.state.activeRooms).map((room) => {
        if (this.state.activeRooms[room].displayOrder <= numDisplayableRooms){
          return <MsgBox user={this.state.user} room={this.state.activeRooms[room]} key={room}/>
        }
        else {
          hiddenRooms[room] = this.state.activeRooms[room];
        }
    });
    let dropUpRooms;
    if (Object.keys(hiddenRooms).length > 0){
      dropUpRooms = <DropUpMsgBox rooms={hiddenRooms} />
    }
    return (
      <div>
        <ChatBox user={this.state.user} directionList={this.state.directionList} favList={this.state.favList}
        searchState={this.state.searchState} searchList={this.state.searchList} state={this.state.chatBox} />
        {activeRooms}
        {dropUpRooms}
      </div>
    )
  }
}

ReactDOM.render(<Chat />, document.getElementById('app'));

export default Chat;
