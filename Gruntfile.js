module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        stripBanners: {
          'block': true
        }
      },
      dist: {
        src: ['deps/md5.js',
              'deps/base64.js',
              'deps/jquery-1.8.2.js',
              'deps/jquery.url.js',
              'deps/jquery.cookie.js',
              'deps/jquery-ui-1.9.1.js',
              'deps/underscore-1.4.4.js',
              'deps/backbone-0.9.10.js',
              'deps/moment-1.1.0.js',
              'deps/strophe.js',
              'deps/strophe.ping.js'],
        dest: 'deps.base.Bundle.new.js'
      }
    },
    minified : {
      files: {
        src: [
        'deps.base.Bundle.new.js'
        ],
        dest: ''
      },
      options : {
        sourcemap: false,
        allinone: false
      }
    },
    jshint: {
      all: ['Gruntfile.js', 'rollcall.js',  'sail.node.server.js', 'sail.strophe.js', 'sail.ui.js']
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-minified');

  // Default task(s).
  // grunt.registerTask('default', ['uglify']);
  grunt.registerTask('default', ['jshint', 'concat', 'minified']);
};
