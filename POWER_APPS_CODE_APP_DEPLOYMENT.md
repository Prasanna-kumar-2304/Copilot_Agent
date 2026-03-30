# Deploy as Microsoft Power Apps Code App

This guide explains how to deploy your DirectLine Bot Chat as a **Code App** in Microsoft Power Apps.

## What is a Code App?

A Code App in Power Apps is a custom web application that you can:
- Write in HTML, CSS, and JavaScript
- Host anywhere (your own server, Azure, etc.)
- Deploy as an embedded app in Power Apps
- Integrate with other Microsoft 365 services

## Prerequisites

✅ You already have:
- Running Node.js API at: https://copilot-agent-kappa.vercel.app
- Power Apps account (Office 365 or standalone)
- Power Apps Developer Plan or Premium license

## Option 1: Deploy as Standalone Web App

### Step 1: Add the Code App HTML Route

Your API already serves the code app. Add this route to your `server.js`:

```javascript
// Serve Power Apps Code App
app.get('/power-app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'power-apps-codeapp.html'));
});
```

### Step 2: Access Your Code App

Once deployed, access at:
```
https://copilot-agent-kappa.vercel.app/power-app
```

### Step 3: Share the URL

You can now share this URL with:
- Power Apps embedded iframe
- Microsoft Teams
- SharePoint
- Any web browser

---

## Option 2: Package as Power Apps Code Component

### Prerequisites
- Node.js installed
- Power Apps CLI (`pac`)
- Visual Studio Code

### Step 1: Install Power Apps CLI

```powershell
npm install -g @microsoft/pac
```

### Step 2: Create Project Structure

```
PowerAppsCodeApp/
├── manifest.xml
├── ControlManifest.Input.xml
├── index.html
├── index.ts
└── css/
    └── styles.css
```

### Step 3: Create manifest.xml

```xml
<?xml version="1.0" encoding="utf-8" ?>
<manifest>
  <control namespace="PowerApps" constructor="DirectLineBotChat" version="1.0.0" display-name-key="DirectLine Bot Chat">
    <type-group name="numbers">
      <type>Whole.None</type>
      <type>Currency</type>
      <type>FP</type>
      <type>Decimal</type>
    </type-group>
    <property name="sessionId" display-name-key="Session ID" description-key="Unique session identifier" of-type="SingleLine.Text" usage="bound" required="false" />
  </control>
</manifest>
```

### Step 4: Build and Package

```powershell
# Install dependencies
npm install

# Build the component
npm run build

# Create solution
pac solution init --publisher-name "YourCompany" --publisher-prefix "dc"
pac solution add-reference --path ..

# Pack the solution
pac solution pack --folder .\
```

---

## Option 3: Embed in Power Apps Canvas App (Easiest)

### Step 1: Go to Power Apps

https://make.powerapps.com

### Step 2: Create Canvas App

1. Click **+ Create**
2. Select **Canvas app from blank**
3. Name: `DirectLine Bot Chat`
4. Click **Create**

### Step 3: Add Web Embed

1. **Insert** → **Media** → **Web embed**
2. Set the URL property:
   ```
   "https://copilot-agent-kappa.vercel.app/power-app"
   ```

### Step 4: Configure Size

```
Rectangle1.Width = Parent.Width - 20
Rectangle1.Height = Parent.Height - 100
```

### Step 5: Save and Publish

- Click **File** → **Save**
- Click **Publish**
- Choose who can access it

---

## Option 4: Deploy to Azure App Service

### Step 1: Create Azure App Service

```powershell
# Login to Azure
az login

# Create resource group
az group create --name DirectLineBotRG --location eastus

# Create App Service Plan
az appservice plan create --name DirectLineBotPlan --resource-group DirectLineBotRG --sku B1 --is-linux

# Create Web App
az webapp create --resource-group DirectLineBotRG --plan DirectLineBotPlan --name directline-bot-app --runtime "node|18"
```

### Step 2: Deploy Code

```powershell
# Navigate to project
cd e:\User\Music\Copilot-Agent

# Install Azure CLI deployment extension
az extension add --name webapp

# Deploy
az webapp up --resource-group DirectLineBotRG --name directline-bot-app --runtime "node|18-lts" --sku B1
```

### Step 3: Configure Environment Variables

```powershell
az webapp config appsettings set --resource-group DirectLineBotRG --name directline-bot-app --settings DIRECTLINE_TOKEN="your-token" DIRECTLINE_API_URL="https://directline.botframework.com/v3/directline"
```

---

## Option 5: Deploy to Azure Container Instances

### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Step 2: Build and Push

```powershell
# Build
docker build -t directline-bot-chat:latest .

# Tag for Azure
docker tag directline-bot-chat:latest <registry>.azurecr.io/directline-bot-chat:latest

# Push
docker push <registry>.azurecr.io/directline-bot-chat:latest
```

### Step 3: Deploy to Container Instances

```powershell
az container create `
  --resource-group DirectLineBotRG `
  --name directline-bot-chat `
  --image <registry>.azurecr.io/directline-bot-chat:latest `
  --registry-login-server <registry>.azurecr.io `
  --registry-username <username> `
  --registry-password <password> `
  --ports 3000 `
  --environment-variables DIRECTLINE_TOKEN="your-token" DIRECTLINE_API_URL="https://directline.botframework.com/v3/directline"
```

---

## Accessing Your Power App

### URL Format:
```
https://make.powerapps.com/environments/[environment-id]/apps/[app-id]/play
```

### Share with Others:
1. Power Apps → Your App → **Share**
2. Enter user/group email
3. Choose permission level
4. Send link

---

## Testing the Code App

### Local Testing:

```bash
# Start local server
npm start

# Access at
http://localhost:3000/power-app
```

### In Power Apps:

1. Create Canvas App
2. Add **Web embed**
3. Insert the public URL
4. Test the chat functionality

---

## Security Considerations

⚠️ **Important:**

1. **Never hardcode tokens** in client-side code
2. **Use CORS properly** - Currently allows all origins
3. **Add authentication** - Use Azure AD
4. **Rate limit** - Prevent abuse
5. **Validate inputs** - Sanitize messages

### Example: Add Authentication Header

```javascript
const response = await fetch(`${API_BASE_URL}api/chat`, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ message, sessionId })
});
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot load resource" | Check CORS configuration |
| 404 errors | Verify API endpoint URL |
| Blank page | Check browser console (F12) |
| API errors | Verify DirectLine token in Vercel env vars |
| Slow loading | Check API server health and latency |

---

## Next Steps

1. ✅ Test the standalone code app
2. ✅ Embed in Power Apps
3. ✅ Share with your organization
4. ✅ Add Power Automate integration
5. ✅ Set up monitoring and analytics

## Support & Resources

- [Power Apps Documentation](https://docs.microsoft.com/power-apps/)
- [Code Components Overview](https://docs.microsoft.com/power-apps/developer/component-framework/)
- [Power Apps CLI Reference](https://docs.microsoft.com/power-apps/developer/cli/)
- [DirectLine API Docs](https://docs.microsoft.com/azure/bot-service/rest-api/bot-framework-rest-direct-line-3-0-api-reference)

