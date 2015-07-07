Chef::Log.info('Performing pre-deploy steps..')

bash 'before_deploy' do
  cwd default[:deploy][application][:current_path]
  code <<-EOF
    gulp
  EOF
end
