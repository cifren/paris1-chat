var serverConfig = {
  host: "",
  port: 6000,
  auth: 'reverse_proxy',
  avatar_url: '',
  ldap: {
    uri: '',
    base: '',
    scope: 1,
    filter: '',
    attrs: '',
    binddn: '',
    password: ''
  },
  shib_login: '',
  upload_server: ''
};

module.exports = serverConfig;
