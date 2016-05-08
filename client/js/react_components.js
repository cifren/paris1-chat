// Chat window components

var ChatBox = React.createClass({
  render: function() {
    return (
      <div className="chat-window">
        <div className="col-xs-12 col-md-12">
          <div className="panel panel-default">
            <ChatBoxHeader />
            <ChatBoxMsgContainer />
            <ChatBoxFooter />
          </div>
        </div>
      </div>
    );
  }
});

var ChatBoxHeader = React.createClass({
  render: function() {
    return (
      <div className="panel-heading top-bar">
        <div className="title_container col-md-8 col-xs-8">
          <div className="status_icone dot_online"></div>
          <div className="panel_title">
            <h3 className="panel-title">Guillaume Fay</h3>
          </div>
        </div>
        <div className="button_container col-md-4 col-xs-4">
          <ButtonFav />
          <ButtonMin />
          <ButtonClose />
        </div>
      </div>
    );
  }
});

var ButtonFav = React.createClass({
  render: function(){
    return (
      <a href="#" data-toggle="tooltip" data-placement="top" title="Add to favorites"><span className="chat_button glyphicon glyphicon-star-empty icon_fav"></span></a>
    );
  }
});

var ButtonMin = React.createClass({
  render: function(){
    return (
      <a href="#"><span data-toggle="tooltip" data-placement="top" title="Minimize" className="chat_button glyphicon glyphicon-minus icon_minim"></span></a>
    );
  }
});

var ButtonClose = React.createClass({
  render: function(){
    return (
      <a href="#"><span data-toggle="tooltip" data-placement="top" title="Close" className="chat_button glyphicon glyphicon-remove icon_close" data-id="chat_window_1"></span></a>
    );
  }
});

var ChatBoxFooter = React.createClass({
  render: function() {
    return (
      <div className="panel-footer">
        <InputArea />
      </div>
    );
  }
});

var ChatBoxMsgContainer = React.createClass({
  render: function() {
    return (
      <div className="panel-body msg_container_base">
        <ChatBoxMsgReceived />
        <ChatBoxMsgSent />
        <ChatBoxMsgReceived />
        <ChatBoxMsgSent />
        <ChatBoxMsgReceived />
        <ChatBoxMsgSent />
        <ChatBoxMsgReceived />
        <ChatBoxMsgSent />
      </div>
    );
  }
});

var Avatar = React.createClass({
  render: function() {
    return (
      <div className="col-md-2 col-xs-2 avatar">
        <img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" className=" img-responsive "/>
      </div>
    );
  }
});

var ChatBoxMsgSent = React.createClass({
  render: function() {
    return (
      <div className="row msg_container base_sent">
          <div className="col-md-10 col-xs-10">
              <div className="messages msg_sent">
                  <p>that mongodb thing looks good, huh?
                  tiny master db, and huge document store</p>
              </div>
          </div>
          <Avatar />
      </div>
    );
  }
});

var ChatBoxMsgReceived = React.createClass({
  render: function() {
    return (
      <div className="row msg_container base_receive">
        <Avatar />
          <div className="col-md-10 col-xs-10">
              <div className="messages msg_receive">
                  <p>that mongodb thing looks good, huh?
                  tiny master db, and huge document store</p>
              </div>
          </div>
      </div>
    );
  }
});

var InputArea = React.createClass({
  render: function(){
    return (
      <div className="input_container">
        <textarea className="input_text" rows="2" placeholder="Write your message here..."></textarea>
        <div className="input_file_upload">
          <a href="#"><span className="glyphicon glyphicon-paperclip"></span></a>
        </div>
      </div>
    );
  }
});


// Main window components

var Container = React.createClass({
  render: function(){
    return (
      <div className="row">
        <MainContainer />
        <ChatBox />
      </div>
    );
  }
});


var MainContainer = React.createClass({
  render: function(){
    return (
      <div className="main-window">
        <div className="col-xs-12 col-md-12">
          <div className="panel panel-default">
            <MainContainerHeader />
            <MainContainerBody />
            <MainContainerFooter />
          </div>
        </div>
      </div>
    );
  }
});

var MainContainerHeader = React.createClass({
  render: function(){
    return (
      <div className="panel-heading top-bar-main">
        <div className="panel_title">
          <h3 className="panel-title">Chat</h3>
        </div>
        <div className="button_container">
          <DropDownStatus />
          <ButtonDisconnect />
        </div>
      </div>
    );
  }
});

var ButtonDisconnect = React.createClass({
  render: function(){
    return (
      <a href="#"><span className="chat_button glyphicon glyphicon-off"></span></a>
    );
  }
});

var DropDownStatus = React.createClass({
  render: function(){
    return (
      <div className="dropdown">
        <button className="dropdown-btn btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
          <div className="status_icone dot_online"></div>
          <span className="caret"></span>
        </button>
        <ul className="dropdown-menu" aria-labelledby="dropdownMenu1">
          <li><a href="#"><div className="status_icone dot_online"></div>Online</a></li>
          <li><a href="#"><div className="status_icone dot_busy"></div>Busy</a></li>
          <li><a href="#"><div className="status_icone dot_offline"></div>Offline</a></li>
        </ul>
      </div>
    );
  }
});


var MainContainerBody = React.createClass({
  render: function(){
    return (
      <div className="panel-body msg_container_base">
      </div>
    );
  }
});

var MainContainerFooter = React.createClass({
  render: function(){
    return (
      <div className="panel-footer">
        <input type="text" id="search" placeholder="Search..."/>
      </div>
    );
  }
});

ReactDOM.render(
  <Container />,
  document.getElementById("container")
);