import config from './../config.js'
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
      roomList: {},
      searchState: false,
      activeRooms: {},
      activeRoom: {},
      user: {status: 'offline'},
      chatBox: {minimized: true, currentTab: 'home'},
      preferences: {sound: true, lang: 'fr', notificationsHTML5: false}
    };
    this.closeChat = this.closeChat.bind(this);
    this.setStatus = this.setStatus.bind(this);
    this.socketEventListener = this.socketEventListener.bind(this);
    this.disconnectUser = this.disconnectUser.bind(this);
    this.connectUser = this.connectUser.bind(this);
    this.loadMsgBox = this.loadMsgBox.bind(this);
    this.manageFavList = this.manageFavList.bind(this);
    this.updateSearchList = this.updateSearchList.bind(this);
    this.closeRoom = this.closeRoom.bind(this);
    this.minMaxBox = this.minMaxBox.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.changeStatusUser = this.changeStatusUser.bind(this);
    this.addMessageToRoom = this.addMessageToRoom.bind(this);
    this.updateRoomListStatus = this.updateRoomListStatus.bind(this);
    this.updateActiveRoomStatus = this.updateActiveRoomStatus.bind(this);
    this.clickOnTab = this.clickOnTab.bind(this);
    this.messageViewed = this.messageViewed.bind(this);
    this.updateBadge = this.updateBadge.bind(this);
    this.userTyping = this.userTyping.bind(this);
    this.manageSound = this.manageSound.bind(this);
    this.uploadProgress = this.uploadProgress.bind(this);
    this.sendMoreData = this.sendMoreData.bind(this);
    this.favClick = this.favClick.bind(this);
    this.sendNotification = this.sendNotification.bind(this);
    this.setRemotePreferences = this.setRemotePreferences.bind(this);
    this.checkNotificationsHTML5 = this.checkNotificationsHTML5.bind(this);
    this.toggleNotificationsHTML5 = this.toggleNotificationsHTML5.bind(this);

    this.connectToServer();

  }

  setChatBoxSize(){
    if (document.location.hash === "#maximized"){
      this.state.chatBox.minimized = false;
      this.setState({chatBox: this.state.chatBox});
    }
  }

  connectToServer(){
    this.socket = io.connect(config.server_url, {reconnect: true, path: config.websocket_path});
    this.socket.emit('join', function (data) {
      let recv = JSON.parse(data);
      if (recv.login === 'successful'){
        this.socketEventListener();
        this.setState({user: recv.user_props});
      }
    }.bind(this));
  }

  closeChat(){
    this.socket.emit('close_chat')
    document.getElementById('app').style.display = "none";
    if (document.cookie.indexOf('pE-tchat=yes') > -1){
      document.cookie = "pE-tchat=;domain=.univ-paris1.fr;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT";
    }
  }

  componentDidMount() {

    this.setChatBoxSize();
    // DOM events
    window.addEventListener('close_chat', this.closeChat);
    window.addEventListener('change_status', this.setStatus);
    window.addEventListener('manage_sound', this.manageSound);
    window.addEventListener('user_button', this.loadMsgBox);
    window.addEventListener('fav_button', this.manageFavList);
    window.addEventListener('search_keypress', this.updateSearchList);
    window.addEventListener('close_room', this.closeRoom);
    window.addEventListener('min_max_box', this.minMaxBox);
    window.addEventListener('send_message', this.sendMessage);
    window.addEventListener('user_typing', this.userTyping);
    window.addEventListener('upload_file', this.uploadFile);
    window.addEventListener('fav_click', this.favClick);
    window.addEventListener('update_notificationsHTML5', this.toggleNotificationsHTML5);

    //TODO : Ne pas utiliser Jquery
    $(document).on('shown.bs.tab', 'a[data-toggle="tab"]', this.clickOnTab);

    this.checkNotificationsHTML5();
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
        activeRooms: {},
        activeRoom: {},
        roomList: {}
      });
      let target = parent.postMessage ? parent : (parent.document.postMessage ? parent.document : undefined);
      target.postMessage("ProlongationENT:disconnect", "*");
    }.bind(this));
    this.socket.on('chat', function(data){
      let recv = JSON.parse(data);
      switch (recv.action){
        case 'direction_list':
          this.setState({directionList: recv.data});
          break;
        case 'fav_list':
          this.setState({favList: recv.data});
          if (Object.keys(this.state.activeRoom).length !== 0){
            this.state.activeRoom.penpal.isFav = (this.state.favList[this.state.activeRoom.penpal.uid]) ? true : false;
            this.setState({activeRoom: this.state.activeRoom});
          }
          break;
        case 'room_list':
          this.setState({roomList: recv.data});
          break;
        case 'update_badge':
          this.updateBadge(recv.data);
          break;
        case 'new_user':
          this.connectUser(recv.user);
          break;
        case 'user_typing':
          this.penpalTyping(recv.data);
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
        case 'message_viewed':
          this.messageViewed(recv.data);
          break;
        case 'penpal_typing':
          this.penpalTyping(recv.data);
          break;
        case 'preferences':
          this.setRemotePreferences(recv.data);
          break;
        case 'send_more_data':
          this.sendMoreData(recv.data);
          break;
        default:
          console.log("Unknown action : " + recv.action);
      }
    }.bind(this));
  }

  checkNotificationsHTML5(){
    if (window.Notification){
      let localPermission = localStorage.getItem("notificationsHTML5");
      if (localPermission !== "denied" || Notification.permission === "default"){
        Notification.requestPermission(function(permission){
          if (permission === "granted"){
            this.state.preferences.notificationsHTML5 = true;
            this.setState({preferences: this.state.preferences});
          }
          localStorage.setItem("notificationsHTML5", permission);
        }.bind(this));
      }
    }
  }

  toggleNotificationsHTML5(){
    if (window.Notification){
      if (this.state.preferences.notificationsHTML5){
        this.state.preferences.notificationsHTML5 = false;
        localStorage.setItem("notificationsHTML5", "denied");
        this.setState({preferences: this.state.preferences});
      }
      else {
        Notification.requestPermission(function(permission){
          this.state.preferences.notificationsHTML5 = (permission === "granted") ? true : false;
          localStorage.setItem("notificationsHTML5", permission);
          this.setState({preferences: this.state.preferences});
        }.bind(this));
      }
    }
  }

  setRemotePreferences(data){
    this.state.preferences.sound = data.sound;
    this.state.preferences.lang = data.lang;
    this.setState({preferences: this.state.preferences});
  }

  userTyping(event){
    if (this.state.user.status !== "invisible"){
      this.socket.emit('user_typing', event.detail);
    }
  }

  penpalTyping(data){
    if (this.state.activeRoom && this.state.activeRoom.room === data.room){
      this.state.activeRoom.penpalTyping = data.penpal_typing;
      this.setState({activeRoom: this.state.activeRoom});
    }
  }

  messageViewed(message){
    if (this.state.activeRoom && this.state.activeRoom.room === message.room){
      this.state.activeRoom.messages.map((msg, i) => {
        if (msg._id === message._id){
          this.state.activeRoom.messages[i].viewed = true;
          this.setState({activeRoom: this.state.activeRoom});
        }
      });
    }
  }

  updateBadge(room){
    if (this.state.roomList[room]){
      this.socket.emit('message_viewed', this.state.roomList[room].lastMessage);
      this.state.roomList[room].lastMessage.viewed = true;
      this.setState({roomList: this.state.roomList});
    }
  }

  setStatus(event){
    let newStatus = event.detail;
    if (this.state.user.status != newStatus){
      this.state.user.status = newStatus;
      this.socket.emit('user_status', this.state.user, function(){
        this.setState({user: this.state.user})
      }.bind(this));
    }
  }

  manageSound(event){
    let newSoundPref = (event.detail === "sound-enabled") ? true : false;
    if (this.state.preferences.sound !== newSoundPref){
      this.state.preferences.sound = newSoundPref;
      this.socket.emit('save_pref', this.state.preferences, function(){
        this.setState({preferences: this.state.preferences});
      }.bind(this));
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
    this.updateActiveRoomStatus(user, user.status);
    this.updateRoomListStatus(user, user.status);
  }

  connectUser(user){
    let notifyUser = true;
    if (this.state.user.uid !== user.uid && this.state.user.direction[0] === user.direction[0]){
      this.state.directionList[user.uid] = user;
      this.setState({directionList: this.state.directionList});
      if (user.status === "online" || user.status === "busy"){
        this.sendNotification(user.name + " est maintenant en ligne");
        notifyUser = false;
      }
    }
    if (this.state.favList[user.uid]){
      this.state.favList[user.uid] = user;
      this.setState({favList: this.state.favList});
      if (notifyUser && user.status === "online" || user.status === "busy"){
        this.sendNotification(user.name + " est maintenant en ligne");
      }
    }
    this.updateActiveRoomStatus(user, user.status);
    this.updateRoomListStatus(user, user.status);
  }

  updateRoomListStatus(user, status){
    Object.keys(this.state.roomList).map((room) => {
      if (user.uid === this.state.roomList[room].penpal.uid){
        this.state.roomList[room].penpal.status = status || 'offline';
        this.setState({roomList: this.state.roomList});
      }
    });
  }

  updateActiveRoomStatus(user, status){
    if (Object.keys(this.state.activeRoom).length !== 0 && this.state.activeRoom.penpal.uid === user.uid){
      this.state.activeRoom.penpal.status = user.status || 'offline';
      this.setState({activeRoom: this.state.activeRoom});
    }
  }

  clickOnTab(event){
    let currentTab = event.target.getAttribute('aria-controls');
    this.state.chatBox.currentTab = currentTab;
    this.setState({chatBox: this.state.chatBox});
    if (this.state.searchState){
      document.getElementById('search').value = "";
      this.setState({searchList: {}});
      this.setState({searchState: false});
    }
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
      this.updateActiveRoomStatus(user);
      this.updateRoomListStatus(user);
    }
  }

  loadMsgBox(event){
    let penpal = event.detail;
    this.socket.emit('load_room', [this.state.user.uid, penpal.uid].sort(), function(data){
      let room = JSON.parse(data);
      if (Object.keys(this.state.activeRoom).length === 0){
        penpal.isFav = (this.state.favList[penpal.uid]) ? true : false;
        room.penpal = penpal;
        this.setState({activeRoom: room});
        this.scrollDivToBottom();
        document.getElementById("msgBox") && document.getElementById("input-text").focus();
      }
      if (this.state.searchState){
        this.setState({searchState: false});
        document.getElementById('search').value = "";
      }
    }.bind(this));
  }

  manageFavList(event){
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
    document.getElementById("msgBox").classList.remove("slideInRight");
    document.getElementById("msgBox").classList.add("slideOutRight");
    window.setTimeout(function(){
      if (Object.keys(this.state.activeRoom).length !== 0){
        this.setState({activeRoom: {}});
      }
    }.bind(this), 800);
  }

  minMaxBox(){
    this.state.chatBox.minimized = (this.state.chatBox.minimized) ? false : true;
    this.setState({chatBox: this.state.chatBox});

    // Send a post message
    let target = parent.postMessage ? parent : (parent.document.postMessage ? parent.document : undefined);
    let message = this.state.chatBox.minimized ? "ProlongationENT:tchat:minimize" : "ProlongationENT:tchat:maximize";
    target.postMessage(message, "*");
  }

  favClick(event){
    let penpal = event.detail.user;
    let mousePosX = event.detail.mousePosX;
    let mousePosY = event.detail.mousePosY;
    let body = document.body;

    let removeMenu = function(e){
      if (e && e.type === 'contextmenu'){
        e.preventDefault();
      }
      if (document.getElementById('context-menu-layer')){
        document.body.removeChild(document.getElementById('context-menu-layer'));
      }
      if (document.getElementById('context-menu')){
        document.body.removeChild(document.getElementById('context-menu'));
      }
    }

    removeMenu();

    let contextMenuLayer = document.createElement('div');
    contextMenuLayer.setAttribute('id', 'context-menu-layer');
    body.appendChild(contextMenuLayer);
    contextMenuLayer.onclick = removeMenu;
    contextMenuLayer.oncontextmenu = removeMenu;

    let contextMenu = document.createElement('ul');
    contextMenu.setAttribute('id', 'context-menu');
    contextMenu.setAttribute('class', 'dropdown-menu');
    body.appendChild(contextMenu);
    if (document.body.clientWidth - (mousePosX + contextMenu.offsetWidth) < 0){
      contextMenu.style.left = mousePosX + (document.body.clientWidth - (mousePosX + contextMenu.offsetWidth)) + "px";
    }
    else {
      contextMenu.style.left = mousePosX + "px";
    }
    contextMenu.style.top = mousePosY + "px";
    contextMenu.onclick = removeMenu;
    contextMenu.oncontextmenu = removeMenu;

    let li = document.createElement('li');
    contextMenu.appendChild(li);

    let a = document.createElement('a');
    li.appendChild(a);
    a.onclick = function(e) {
      window.dispatchEvent(new CustomEvent('fav_button', {detail: {user: penpal}}));
    }

    if (this.state.favList[penpal.uid]){
      penpal.isFav = true;
      a.innerHTML = "Retirer des favoris";
    }
    else {
      penpal.isFav = false;
      a.innerHTML = "Ajouter aux favoris";
    }
  }

  sendMessage(event){
    let message = event.detail;
    this.socket.emit('send_message', message);
  }

  uploadProgress(progress){
    this.state.activeRoom.fileUpload.progress = progress;
    this.setState({activeRoom: this.state.activeRoom});
  }

  uploadFile(e){
    let file = e.detail.file;
    let penpal = e.detail.receiver;
    let room = e.detail.room;
    this.state.activeRoom.fileUpload = {
      "file": file,
      "progress": 0,
      "reader": new FileReader()
    };
    this.setState({activeRoom: this.state.activeRoom});
    this.socket.emit("start_upload", {'name': file.name, 'size': file.size});
    let reader = new FileReader();
    this.state.activeRoom.fileUpload.reader.onload = function(event){
      let data = event.target.result;
      this.socket.emit("upload_file", {'name': file.name, 'owner': this.state.user.uid, 'type': file.type, 'size': file.size, 'data': data}, function(data){
        let recv = JSON.parse(data);
        if (recv.successful){
          console.log(recv);
          window.dispatchEvent(new CustomEvent("send_message", {
            detail: {
              room: room,
              text: recv.link,
              receiver: penpal.uid,
              isLink: true
            }
          }));
        }
        else {
          alert("Le fichier n'a pas pu être envoyé.");
        }
        delete this.state.activeRoom.fileUpload;
        this.setState({activeRoom: this.state.activeRoom});
      }.bind(this));
    }.bind(this);
  }

  sendMoreData(data){
    this.uploadProgress(data.progress);
    let place = data.place * 524288;
    let blob;
    if (this.state.activeRoom.fileUpload.file.webkitSlice){
      blob = this.state.activeRoom.fileUpload.file.webkitSlice(place, place + Math.min(524288, this.state.activeRoom.fileUpload.file.size - place));
    }
    else if (this.state.activeRoom.fileUpload.file.mozSlice) {
      blob = this.state.activeRoom.fileUpload.file.mozSlice(place, place + Math.min(524288, this.state.activeRoom.fileUpload.file.size - place));
    }
    else {
      blob = this.state.activeRoom.fileUpload.file.slice(place, place + Math.min(524288, this.state.activeRoom.fileUpload.file.size - place));
    }
    this.state.activeRoom.fileUpload.reader.readAsBinaryString(blob);
  }

  scrollDivToBottom(){
    if (document.getElementById("msgBox")){
      let div = document.getElementById("msgBox").getElementsByClassName('panel-body')[0];
      div.scrollTop = div.scrollHeight;
    }
  }

  playNewMessageSound(message){
    if (this.state.preferences.sound && message.owner !== this.state.user.uid){
      let audio = new Audio('./../sounds/popup.mp3');
      audio.play();
    }
  }

  sendNotification(body){
    if (this.state.preferences.notificationsHTML5){
      var notification = new Notification("Tchat Paris 1", {
        body: body,
        icon: "./../tchat.png"
      });
      window.setTimeout(function(){
        notification.close();
      }, 5000);
    }
  }

  addMessageToRoom(message){
    let notifyUser = true;
    if (this.state.activeRoom.room && this.state.activeRoom.room === message.room){
      if (message.owner !== this.state.user.uid){
        this.socket.emit('message_viewed', message);
        message.viewed = true;
      }
      this.state.activeRoom.messages.push(message);
      this.setState({activeRoom: this.state.activeRoom});
      this.scrollDivToBottom();
      if (window.hasFocus || message.owner === this.state.user.uid) {
        notifyUser = false;
      }
    }

    if (this.state.roomList[message.room]){
      this.state.roomList[message.room].lastMessage = message;
      this.setState({roomList: this.state.roomList});
      this.playNewMessageSound(message);
      if (notifyUser){
        this.sendNotification(this.state.roomList[message.room].penpal.name + " vous a envoyé un nouveau message.");
      }
    }
    else {
      this.socket.emit("update_roomlist", message, function(data){
        let roomListUpdate = JSON.parse(data);
        this.state.roomList[roomListUpdate.room] = roomListUpdate.update;
        this.setState({roomList: this.state.roomList});
        this.playNewMessageSound(message);
        if (notifyUser){
          this.sendNotification(this.state.roomList[message.room].penpal.name + " vous a envoyé un nouveau message.");
        }
      }.bind(this));
    }
  }

  render(){
    let activeRoom;
    if (Object.keys(this.state.activeRoom).length !== 0){
      activeRoom = <MsgBox user={this.state.user} room={this.state.activeRoom} />
    }
    return (
      <div>
        <ChatBox user={this.state.user} directionList={this.state.directionList} favList={this.state.favList}
        searchState={this.state.searchState} searchList={this.state.searchList} roomList={this.state.roomList} state={this.state.chatBox}
        preferences={this.state.preferences}/>
        {activeRoom}
      </div>
    )
  }
}

ReactDOM.render(<Chat />, document.getElementById('app'));

export default Chat;
