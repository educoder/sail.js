BUNDLES = {}

BUNDLES['deps.base'] = [
  'deps/md5',
  'deps/base64',
  'deps/jquery-1.6.2',
  'deps/jquery.url',
  'deps/jquery.cookie',
  'deps/jquery-ui-1.8.14',
  'deps/underscore-1.3.3',
  'deps/moment-1.1.0',
  'deps/strophe',
  'deps/strophe.ping',
]

if ARGV.length == 0
  selected_bundles = ['deps.base']
else
  selected_bundles = ARGV.map{|arg| arg.to_s}.uniq
end

selected_bundles.each do |bundle|
  File.open("#{bundle}.BUNDLE.js", 'w') do |bundle_file|
    js = ""
    js << "\n\n/*** ----------- star of [#{bundle}] ----------- ***/\n\n"

    BUNDLES[bundle].each do |jsfile|
      jsfile = jsfile + ".js"
      js <<  "\n\n/*** [#{jsfile}] ***/\n\n"
      js << File.open(jsfile, "r").read
    end

    js << "\n\n/*** ----------- end of [#{bundle}] ----------- ***/\n\n"

    bundle_file.write(js)
  end
end
