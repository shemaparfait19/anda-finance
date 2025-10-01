import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import SmsReminderForm from './sms-reminder-form';
import SettingsPage from './settings-page';
import UserManagementPage from './user-management-page';

export default function AdminPage() {
  return (
    <Tabs defaultValue="sms-reminder" className="space-y-4">
      <TabsList>
        <TabsTrigger value="sms-reminder">SMS Reminder Tool</TabsTrigger>
        <TabsTrigger value="settings">System Settings</TabsTrigger>
        <TabsTrigger value="users">User Management</TabsTrigger>
      </TabsList>
      
      <TabsContent value="sms-reminder">
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered SMS Payment Reminder</CardTitle>
            <CardDescription>
              Use AI to determine whether to send an SMS reminder for an upcoming payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SmsReminderForm />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <SettingsPage />
      </TabsContent>

      <TabsContent value="users">
        <UserManagementPage />
      </TabsContent>
    </Tabs>
  );
}
