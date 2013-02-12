BUNDLES = {}

BUNDLES['deps.base'] = [
  'deps/md5',
  'deps/base64',
  'deps/jquery-1.8.2',
  'deps/jquery.url',
  'deps/jquery.cookie',
  'deps/jquery-ui-1.9.1',
  'deps/underscore-1.4.4',
  'deps/backbone-0.9.10',
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
    js << "\n\n/*** ----------- start of [#{bundle}] ----------- ***/\n\n"

    BUNDLES[bundle].each do |jsfile|
      jsfile = jsfile + ".js"
      js <<  "\n\n/*** [#{jsfile}] ***/\n\n"
      js << File.open(jsfile, "r").read
    end

    js << "\n\n/*** ----------- end of [#{bundle}] ----------- ***/\n\n"

    bundle_file.write(js)
  end
end
