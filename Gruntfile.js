module.exports = function (grunt) {
    grunt.initConfig({
      // This will watch changes on all files inside `module` directory.
      watch: {
        // on changes copy into node_modules, only dev env
        source: {
          files: [
            'server/module/shibboleth_connection/**.*',
            'server/module/ldap_user/**.*'
          ],
          tasks: ['copy']
        }
      },
      copy: {
        shibboleth_connection: {
          files: [
            {
              expand: true,
              cwd: 'server/module/shibboleth_connection/',
              src: ['**'],
              dest: 'node_modules/shibboleth_connection', filter: 'isFile'},
          ],
        },
        ldap_user: {
          files: [
            {
              expand: true,
              cwd: 'server/module/ldap_user/',
              src: ['**'],
              dest: 'node_modules/ldap_user', filter: 'isFile'},
          ],
        }
      },
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['copy', 'watch']);
};
