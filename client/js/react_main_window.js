var Container = React.createClass({
  render: function(){
    return (
      <div className="row">
        <MainContainer />
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
        <div className="col-md-8 col-xs-8">
          <h3 className="panel-title">Chat Paris 1</h3>
        </div>
      </div>
    );
  }
});

// var MainContainerBody = React.createClass({
//   render: function(){
//     return (

//     );
//   }
// });

// var MainContainerFooter = React.createClass({
//   render: function(){
//     return (

//     );
//   }
// });

ReactDOM.render(
  <Container />,
  document.getElementById("container")
);