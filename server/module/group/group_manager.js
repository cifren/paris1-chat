var groupManager = {
  userGroupModel: undefined,
  groupsInCommon: function(a, b){
    var result = [];
    if(a.length > 0 && b.length > 0){
      var i = a.length;
      while(i--){
        var j = b.length;
        while(j--){
          if(a[i].group == b[j].group){
            return true;
          }
        }
      }
    }

    return false;
  },
  // get groups from user_group model
  getGroupsFromUserId: function(userId){
    return this.getUserGroupModel().find({user: userId}).exec();
  },
  getUserGroupModel: function(){
    return this.userGroupModel;
  }
};

module.exports = groupManager;
