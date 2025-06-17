/**
 * Bright Data Asynchronous Web Unlocker API Example
 */

const CONFIG = {
    apikey: process.env.BRIGHT_DATA_API_KEY || 'YOUR_BRIGHT_DATA_API_KEY',
    zone: process.env.BRIGHT_DATA_ZONE || 'web_unlocker1',
    targetUrl: 'https://geo.brdtest.com/welcome.txt',
    pollingInterval: 2000, // 2 seconds
    maxAttempts: 30 // 1 minute total
};

async function makeRequest() {
    try {
        // Step 1: Initiate request
        console.log('🔄 Starting request...');
        const initResponse = await fetch('https://api.brightdata.com/unblocker/req', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.apikey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                zone: CONFIG.zone,
                url: CONFIG.targetUrl
            })
        });

        if (!initResponse.ok) throw new Error(`HTTP error! Status: ${initResponse.status}`);
        const { response_id } = await initResponse.json();
        console.log('✅ Request initiated');

        // Step 2: Poll for results
        for (let attempt = 1; attempt <= CONFIG.maxAttempts; attempt++) {
            console.log(`⏳ Polling attempt ${attempt}/${CONFIG.maxAttempts}...`);
            
            const pollResponse = await fetch(`https://api.brightdata.com/unblocker/get_result?response_id=${response_id}`, {
                headers: { 'Authorization': `Bearer ${CONFIG.apikey}` }
            });

            if (!pollResponse.ok) throw new Error(`HTTP error! Status: ${pollResponse.status}`);
            
            const responseText = await pollResponse.text();
            if (responseText === "Request is pending") {
                await new Promise(resolve => setTimeout(resolve, CONFIG.pollingInterval));
                continue;
            }

            // Try parsing as JSON, if fails return as text
            try {
                const data = JSON.parse(responseText);
                if (data.status === 'failed') throw new Error(data.error || 'Request failed');
                if (data.status === 'completed' || data.html || data.text) {
                    console.log('✅ Request completed!');
                    return data;
                }
            } catch {
                console.log('✅ Request completed with text response!');
                return { text: responseText, format: 'text' };
            }
        }
        throw new Error('Maximum polling attempts reached');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the request
makeRequest().then(console.log);

/**
 * How to use this script:
 * 1. Get your API key from https://brightdata.com/cp/setting/users
 * 2. Choose your zone from https://brightdata.com/cp/zones
 * 3. Set your target URL
 * 4. For better security, set environment variables:
 *    - export BRIGHT_DATA_API_key=your_key_here
 *    - export BRIGHT_DATA_ZONE=your_zone_here
 * 5. Run the script with: node index.js
 */