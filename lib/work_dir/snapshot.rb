require 'work_dir/base'
require 'fileutils'

module WorkDir
  # A snapshot of a git repo
  class Snapshot < Base
    # Rsync files from the source working dir, skip .git
    def sync(source)
      raise "Can't sync from non-existant #{source.working_dir}" unless source.exist?
      FileUtils.mkdir_p(File.dirname(working_dir))
      cmd 'rsync', '-a', '--exclude', '.git', "#{source.working_dir}/", "#{working_dir}/"
    end

    # Run the blueprint build command with the supplied data
    def build(data)
      working_dir do
        cmd WorkDir::BLUEPRINT_BUILD_COMMAND, :stdin_data => data.to_json
      end
    end
  end
end
