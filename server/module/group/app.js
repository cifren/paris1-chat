var groupManager = require('./group_manager'),
    ugModelJson = require('./model/user_group'),
    socketContainer = require('../../socket'),
    myEmitter = socketContainer.eventEmitter;

var group = {
  groupManager: groupManager,
  ugModelJson: ugModelJson,
  ugModel: undefined,
  databaseManager: undefined,
  init:function(){
    this.databaseManager = socketContainer.container.database_manager;
    this.groupConfig = socketContainer.config.group;
    this.groupManager.userGroupModel = this.getUgModel();
    this._listeners();
  },
  // listeners
  _listeners: function(){
    myEmitter.on('search', (event) => {
      var userList = event.user_list;
      var currentUser = event.current_user;

      // check for the config option
      if(this.groupConfig.search_by_group){
        // get groups from user
        groupManager
          .getGroupsFromUserId(currentUser._id)
          .then(function(userGroups){
            //remove user from the list if not part of the same groups
            Object.keys(userList).forEach(function(key){
              // get groups from user
              var userGroups =  groupManager.getGroupsFromUserId(key);
              // compares groups
              if(!groupManager.groupsInCommon(currentUserGroups, userGroups)){
                delete userList[key];
              }
            });
          });
      }
    });
  },
  _getUgJsonModel: function(){
    return this.ug_model_json;
  },
  getUgModel: function(){
    if(!this.ugModel){
      // compile model
      this.databaseManager.compileModel('UserGroup', this._getUgJsonModel());
      this.ugModel = this.databaseManager.getModel('User');
    }
    return this.ugModel;
  }
}

// Activate init function when socket is ready
myEmitter.on('plugin', (event) => {
  group.init();
});

module.exports = group;
