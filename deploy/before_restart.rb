Chef::Log.info('Performing pre-deploy steps..')

bash 'before_deploy' do
  cwd '/srv/www/core_wrio_app/current'
  user 'root'
  code <<-EOF
    npm install -g gulp
  EOF
end


bash 'after_deploy' do
  cwd '/srv/www/core_wrio_app/current'
  user 'deploy'
  code <<-EOF
    gulp
  EOF
end
