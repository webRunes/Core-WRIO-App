Chef::Log.info('Performing pre-deploy steps..')

bash 'before_deploy' do
  cwd path ::File.join(deploy[:deploy_to], "current")
  code <<-EOF
    gulp
  EOF
end
