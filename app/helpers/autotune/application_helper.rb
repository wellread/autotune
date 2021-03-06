module Autotune
  # Template tags!
  module ApplicationHelper
    def config
      {
        :project_statuses => Autotune::PROJECT_STATUSES,
        :project_themes => Project.uniq.pluck(:theme),
        :project_blueprints => Project.uniq.pluck(:blueprint_id),
        :blueprint_statuses => Autotune::BLUEPRINT_STATUSES,
        :blueprint_types => Blueprint.uniq.pluck(:type),
        :blueprint_tags => Tag.all.as_json(:only => [:title, :slug])
      }
    end
  end
end
