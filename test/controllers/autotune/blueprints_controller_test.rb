require 'test_helper'

module Autotune
  # Test blueprint api
  class BlueprintsControllerTest < ActionController::TestCase
    fixtures 'autotune/blueprints', 'autotune/projects'
    test 'that listing blueprints requires authentication' do
      accept_json!

      get :index
      assert_response :unauthorized
      assert_equal({ 'error' => 'Unauthorized' }, decoded_response)
    end

    test 'listing blueprints' do
      accept_json!
      valid_auth_header!

      get :index
      assert_response :success
      assert_instance_of Array, decoded_response
      assert_equal autotune_blueprints(:example).id, decoded_response.first['id']
    end

    test 'show blueprint' do
      accept_json!
      valid_auth_header!

      get :show, :id => autotune_blueprints(:example).id
      assert_response :success
      assert_blueprint_data!
      assert_equal autotune_blueprints(:example).id, decoded_response['id']
    end

    test 'create blueprint' do
      # make sure we remove the example blueprint
      autotune_blueprints(:example).destroy

      accept_json!
      valid_auth_header!

      title = 'New blueprint'

      post :create, :title => title, :repo_url => repo_url
      assert_response :created
      assert_blueprint_data!

      new_bp = Blueprint.find decoded_response['id']
      assert_equal title, new_bp.title
    end

    test 'update blueprint' do
      accept_json!
      valid_auth_header!

      title = 'Updated blueprint'

      put(:update,
          :id => autotune_blueprints(:example).id,
          :title => title)
      assert_response :success
      assert_blueprint_data!

      new_bp = Blueprint.find decoded_response['id']
      assert_equal title, new_bp.title
    end

    test 'delete blueprint' do
      accept_json!
      valid_auth_header!

      delete :destroy, :id => autotune_blueprints(:example).id
      assert_response :no_content
    end

    test 'filter blueprints' do
      accept_json!
      valid_auth_header!

      get :index, :status => 'ready'
      assert_response :success
      assert_instance_of Array, decoded_response
      assert_equal 0, decoded_response.length
    end

    private

    def assert_blueprint_data!
      assert_data %w(title slug id repo_url config created_at updated_at)
    end
  end
end
