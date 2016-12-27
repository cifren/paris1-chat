import config from './../config.js'
import React from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import MsgBox from './msgbox/MsgBox.jsx';
import ChatBox from './chatbox/ChatBox.jsx';
import Cookie from 'js-cookie';

class Chat extends React.Component {

  constructor(){
    super();
    this.state = {
      directionLists: {},
      favList: {},
      searchList: {},
      roomList: {},
      searchState: false,
      activeRooms: {},
      activeRoom: {},
      user: {status: 'offline'},
      chatBox: {minimized: true, currentTab: 'home'},
      preferences: {sound: true, lang: 'fr', notification: "denied", visibility: "everybody"}
    };
    this.closeChat = this.closeChat.bind(this);
    this.sendStatus = this.sendStatus.bind(this);
    this.socketEventListener = this.socketEventListener.bind(this);
    this.updateLists = this.updateLists.bind(this);
    this.notifyUpdateList = this.notifyUpdateList.bind(this);
    this.loadMsgBox = this.loadMsgBox.bind(this);
    this.manageFavList = this.manageFavList.bind(this);
    this.updateSearchList = this.updateSearchList.bind(this);
    this.closeRoom = this.closeRoom.bind(this);
    this.minMaxBox = this.minMaxBox.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
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
    this.contextMenu = this.contextMenu.bind(this);
    this.displayNotification = this.displayNotification.bind(this);
    this.checkNotification = this.checkNotification.bind(this);
    this.toggleNotification = this.toggleNotification.bind(this);
    this.deleteConversation = this.deleteConversation.bind(this);
    this.updateDeletedConversation = this.updateDeletedConversation.bind(this);
    this.manageVisibility = this.manageVisibility.bind(this);
    this.setStatus = this.setStatus.bind(this);

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
    this.socket.emit('join',
      function (data) {
        let recv = JSON.parse(data);
        if (recv.login === 'successful'){
          this.socketEventListener();
          this.setState({user: recv.user_props});
console.log(recv.user_props)
          if(Cookie.get('userId') != recv.user_props.uid){
            Cookie.set('userId', recv.user_props.uid);
          }
        }
      }.bind(this)
    );
  }

  setStatus(status){
    this.state.user.status = status;
    this.setState({user: this.state.user});
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
    window.addEventListener('change_status', this.sendStatus);
    window.addEventListener('change_sound', this.manageSound);
    window.addEventListener('change_notification', this.toggleNotification);
    window.addEventListener('change_visibility', this.manageVisibility);
    window.addEventListener('user_button', this.loadMsgBox);
    window.addEventListener('fav_button', this.manageFavList);
    window.addEventListener('search_keypress', this.updateSearchList);
    window.addEventListener('close_room', this.closeRoom);
    window.addEventListener('min_max_box', this.minMaxBox);
    window.addEventListener('send_message', this.sendMessage);
    window.addEventListener('user_typing', this.userTyping);
    window.addEventListener('upload_file', this.uploadFile);
    window.addEventListener('context_menu', this.contextMenu);
    window.addEventListener('del_conversation', this.deleteConversation);

    //TODO : Ne pas utiliser Jquery
    $(document).on('shown.bs.tab', 'a[data-toggle="tab"]', this.clickOnTab);

    this.checkNotification();
  }

  socketEventListener(){
    this.socket.on('custom_error', function(recv){
      alert(recv.message);
    });
    this.socket.on('disconnect', function(){
      this.setState({
        user: {status: 'offline'},
        directionLists: {},
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
          this.setState({directionLists: recv.data});
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
        case 'user_connected':
          this.updateLists(recv.user, "connect");
          break;
        case 'user_changed_status':
          this.updateLists(recv.user, "status");
          break
        case 'user_disconnected':
          this.updateLists(recv.user, "disconnect");
          break;
        case 'user_typing':
          this.penpalTyping(recv.data);
          break;
        case 'message':
          this.addMessageToRoom(recv.data);
          break
        case 'disconnect_user':
          this.socket.disconnect();
          break;
        case 'set_status':
          this.setStatus(recv.data);
          break;
        case 'message_viewed':
          this.messageViewed(recv.data);
          break;
        case 'penpal_typing':
          this.penpalTyping(recv.data);
          break;
        case 'preferences':
          this.setPreferences(recv.data);
          break;
        case 'send_more_data':
          this.sendMoreData(recv.data);
          break;
        case 'update_del_conversation':
          this.updateDeletedConversation(recv.data);
          break;
        default:
          console.log("Unknown action : " + recv.action);
      }
    }.bind(this));
  }

  setPreferences(pref){
    this.state.preferences.sound = pref.sound;
    this.state.preferences.lang = pref.lang;
    this.state.preferences.notification = (Notification.permission !== "granted") ? "denied" : pref.notification;
    this.state.preferences.visibility = pref.visibility;
    this.setState({preferences: this.state.preferences});
  }

  checkNotification(){
    if (window.Notification){
      Notification.requestPermission(function(permission){
        if (permission === "granted"){
          this.state.preferences.notification = "all";
          this.setState({preferences: this.state.preferences});
        }
      }.bind(this));
    }
  }

  toggleNotification(event){
    if (window.Notification){
      if (Notification.permission === "granted"){
        this.state.preferences.notification = event.detail;
        this.socket.emit('save_pref', this.state.preferences);
      }
      else {
        this.checkNotification();
      }
    }
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
      this.state.roomList[room].lastMessage.viewed = true;
      this.setState({roomList: this.state.roomList});
    }
  }

  sendStatus(event){
    let newStatus = event.detail;
    if (this.state.user.status != newStatus){
      this.state.user.status = newStatus;
      this.socket.emit('change_status', this.state.user, function(){
        this.setState({user: this.state.user});
      }.bind(this));
    }
  }

  manageSound(event){
    let newSoundPref = (event.detail === "sound-enabled") ? true : false;
    if (this.state.preferences.sound !== newSoundPref){
      this.state.preferences.sound = newSoundPref;
      this.socket.emit('save_pref', this.state.preferences);
    }
  }

  manageVisibility(event){
    let newVisibility = event.detail;
    if (this.state.preferences.visibility !== newVisibility){
      this.state.preferences.visibility = newVisibility;
      this.socket.emit('save_pref', this.state.preferences);
    }
  }

  updateRoomListStatus(user){
    Object.keys(this.state.roomList).map((room) => {
      if (user.uid === this.state.roomList[room].penpal.uid){
        this.state.roomList[room].penpal.status = user.status || 'offline';
        this.setState({roomList: this.state.roomList});
      }
    });
  }

  updateActiveRoomStatus(user){
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
      document.getElementById('chat-search').value = "";
      this.setState({searchList: {}});
      this.setState({searchState: false});
    }
  }

  updateLists(user, action){
    let notifyUser = true;
    /*let userUid = String(user.uid);
    user.directions.map((direction) => {
      if (this.state.directionLists[direction]) {
        if (this.state.user.affiliationType !== user.affiliationType || this.state.user.uid === userUid){
          return;
        }
        if (user.listeRouge && user.affiliationType === "student"){
          return;
        }
        switch (action){
          case "disconnect":
            if (this.state.directionLists[direction].list[userUid]){
              notifyUser = (user.status !== "invisible") ? true : false;
              delete this.state.directionLists[direction].list[userUid];
              this.setState({directionLists: this.state.directionLists});
            }
            break;
          case "status":
            if (this.state.directionLists[direction].list[userUid]){
              this.state.directionLists[direction].list[userUid].status = user.status;
              this.setState({directionLists: this.state.directionLists});
            }
            break;
          default:
            notifyUser = (user.status !== "invisible") ? true : false;
            this.state.directionLists[direction].list[userUid] = user;
            this.setState({directionLists: this.state.directionLists});
        }
        if (notifyUser){
          this.notifyUpdateList(user, action);
          notifyUser = false;
        }
      }
    });*/
    /*if (this.state.favList[userUid]){
      switch (action){
        case "disconnect":
          notifyUser = (notifyUser && user.status !== "invisible") ? true : false;
          //this.state.favList[userUid].status = 'offline';
          this.setState({favList: this.state.favList});
          break;
        case "status":
          //this.state.favList[userUid].status = user.status;
          this.setState({favList: this.state.favList});
        break;
        default:
          notifyUser = (notifyUser && user.status !== "invisible") ? true : false;
          //this.state.favList[userUid] = user;
          this.setState({favList: this.state.favList});
      }
      if (notifyUser){
        this.notifyUpdateList(user, action);
      }
    }*/
    this.updateActiveRoomStatus(user);
    this.updateRoomListStatus(user);
  }

  notifyUpdateList(user, action){
    let statusLabel;
    switch(user.status){
      case "online":
        statusLabel = "en ligne";
        break;
      case "busy":
        statusLabel = "indisponible";
        break;
      default:
        statusLabel = "hors ligne";
        break;
    }
    this.socket.emit('display_notification', {uid: user.uid, action: action}, function(){
      this.displayNotification(user.name + " est maintenant " + statusLabel, "status")
    }.bind(this));
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
        document.getElementById('chat-search').value = "";
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
    let searchState = (search.length === 0) ? false : true;
    if (this.state.searchState !== searchState){
      this.setState({searchState: searchState});
    }
    if (searchState){
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

  contextMenu(event){
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

    // Add or del favoris
    if (!penpal.listeRouge || this.state.affiliationType === "staff"){
      let liFav = document.createElement('li');
      contextMenu.appendChild(liFav);

      let aFav = document.createElement('a');
      liFav.appendChild(aFav);

      aFav.onclick = function(e) {
        window.dispatchEvent(new CustomEvent('fav_button', {detail: {user: penpal}}));
      }

      if (this.state.favList[penpal.uid]){
        penpal.isFav = true;
        aFav.innerHTML = "Retirer des favoris";
      }
      else {
        penpal.isFav = false;
        aFav.innerHTML = "Ajouter aux favoris";
      }
    }

    // Delete conversation
    this.socket.emit('check_room_not_empty', [this.state.user.uid, penpal.uid].sort(), function(room){
      if (room){
        let liDelConv = document.createElement('li');
        contextMenu.appendChild(liDelConv);

        let aDelConv = document.createElement('a');
        liDelConv.appendChild(aDelConv);
        aDelConv.innerHTML = "Effacer la discussion";

        aDelConv.onclick = function(e) {
          window.dispatchEvent(new CustomEvent('del_conversation', {detail: {room: room, penpal: penpal}}));
        }
      }
    });
  }

  deleteConversation(event){
    let room = event.detail.room;
    let penpal = event.detail.penpal;
    this.socket.emit('del_conversation', {room: room, penpal: penpal})
  }

  updateDeletedConversation(room){
    if (this.state.activeRoom.room === room){
      this.state.activeRoom.messages = [];
      this.setState({activeRoom: this.state.activeRoom});
    }
    if (this.state.roomList[room]){
      delete this.state.roomList[room];
      this.setState({roomList: this.state.roomList});
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

  displayNotification(body, type){
    if (window.hasFocus){
      return;
    }
    if (this.state.preferences.notification === "all" || this.state.preferences.notification === type){
      let notification = new Notification("Tchat Paris 1", {
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

    if (message.owner === this.state.user.uid) {
      notifyUser = false;
    }

    if (this.state.activeRoom.room && this.state.activeRoom.room === message.room){
      if (message.owner !== this.state.user.uid){
        this.socket.emit('message_viewed', message);
        message.viewed = true;
      }
      this.state.activeRoom.messages.push(message);
      this.setState({activeRoom: this.state.activeRoom});
      this.scrollDivToBottom();
    }

    if (this.state.roomList[message.room]){
      this.state.roomList[message.room].lastMessage = message;
      this.setState({roomList: this.state.roomList});
      this.playNewMessageSound(message);
      if (notifyUser){
        this.socket.emit("display_notification", null, function(){
          this.displayNotification(this.state.roomList[message.room].penpal.name + " vous a envoyé un nouveau message.", "message");
        }.bind(this));
      }
    }
    else {
      this.socket.emit("update_roomlist", message, function(data){
        let roomListUpdate = JSON.parse(data);
        this.state.roomList[roomListUpdate.room] = roomListUpdate.update;
        this.setState({roomList: this.state.roomList});
        this.playNewMessageSound(message);
        if (notifyUser){
          this.socket.emit("display_notification", null, function(){
            this.displayNotification(this.state.roomList[message.room].penpal.name + " vous a envoyé un nouveau message.", "message");
          }.bind(this));
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
        <ChatBox user={this.state.user} directionLists={this.state.directionLists} favList={this.state.favList}
        searchState={this.state.searchState} searchList={this.state.searchList} roomList={this.state.roomList} state={this.state.chatBox}
        preferences={this.state.preferences}/>
        {activeRoom}
      </div>
    )
  }
}

ReactDOM.render(<Chat />, document.getElementById('app'));

export default Chat;
