# Arcadia Game Integration Guide

This guide explains how to integrate your Godot game with the Arcadia Business platform using iframe and postMessage communication.

## Overview

The integration uses the following approach:
1. Your Godot game is loaded in an iframe within the Arcadia platform
2. The platform sends hero data to your game using `postMessage`
3. Your game can save hero data back to the platform using `postMessage`
4. The platform can save the data to a database and blockchain

## Communication Protocol

### Receiving Hero Data in Godot

When your game loads, the Arcadia platform will send hero data to your game. Here's how to receive it in Godot:

```gdscript
extends Node

var hero_data = null

func _ready():
    # Set up JavaScript interface
    if OS.has_feature("JavaScript"):
        # Create a callback function that JavaScript can call
        JavaScript.create_callback(self, "receive_hero_data")
        
        # Add a listener for postMessage events
        JavaScript.eval("""
            window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'HERO_DATA') {
                    godot.receive_hero_data(JSON.stringify(event.data.payload));
                }
            });
        """)

# This function will be called from JavaScript
func receive_hero_data(data_json):
    # Parse the JSON data
    var json = JSON.parse_string(data_json)
    if json:
        hero_data = json
        print("Received hero data: ", hero_data)
        # Update your game with the hero data
        update_game_with_hero_data()

func update_game_with_hero_data():
    if hero_data:
        # Example: Update player name
        $PlayerNameLabel.text = hero_data.name
        
        # Example: Update player stats
        var points = hero_data.points
        var level = hero_data.level
        
        # Update your game accordingly
        # ...
```

### Saving Hero Data from Godot

When the player wants to save their progress, you can send the updated hero data back to the Arcadia platform:

```gdscript
func save_hero_data():
    if OS.has_feature("JavaScript") and hero_data:
        # Update hero data with current game state
        hero_data.points = 300  # Example: Update points
        hero_data.level = 2     # Example: Update level
        
        # Send data back to the parent window
        var data_to_send = JSON.stringify({
            "type": "SAVE_HERO",
            "payload": hero_data
        })
        
        JavaScript.eval("window.parent.postMessage(" + data_to_send + ", '*');")
        print("Sent hero data to platform for saving")

# Connect this to a save button in your game
func _on_SaveButton_pressed():
    save_hero_data()
```

## Example HTML Integration

For testing locally, you can use this HTML file to simulate the Arcadia platform:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Godot Game Integration Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        iframe { width: 800px; height: 600px; border: 1px solid #ccc; }
        button { padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Godot Game Integration Test</h1>
    
    <div>
        <button id="sendDataBtn">Send Hero Data to Game</button>
        <iframe id="gameFrame" src="./index.html"></iframe>
    </div>
    
    <div id="receivedData">
        <h3>Received Data:</h3>
        <pre id="dataDisplay">None yet</pre>
    </div>
    
    <script>
        // Example hero data
        const heroData = {
            name: "TestHero",
            points: 100,
            level: 1,
            userId: "test@example.com",
            createdAt: new Date().toISOString()
        };
        
        // Send data to the game
        document.getElementById('sendDataBtn').addEventListener('click', () => {
            const iframe = document.getElementById('gameFrame');
            iframe.contentWindow.postMessage({
                type: 'HERO_DATA',
                payload: heroData
            }, '*');
            console.log('Sent hero data to game:', heroData);
        });
        
        // Listen for messages from the game
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SAVE_HERO') {
                console.log('Received save request from game:', event.data.payload);
                document.getElementById('dataDisplay').textContent = 
                    JSON.stringify(event.data.payload, null, 2);
            }
        });
    </script>
</body>
</html>
```

## Integration Checklist

1. Set up JavaScript communication in your Godot project
2. Implement the `receive_hero_data` function to handle incoming data
3. Update your game UI and logic based on the hero data
4. Implement a save mechanism that sends updated data back to the platform
5. Test the integration using the example HTML file
6. Deploy your game to the `/game` directory in the Arcadia Business platform

## Troubleshooting

- **No data received**: Make sure your game is properly set up to receive postMessage events
- **Cannot send data**: Verify that JavaScript is enabled and working in your Godot export
- **Data format issues**: Check that you're properly parsing and stringifying JSON data

## Advanced Features

### Blockchain Integration

The Arcadia platform can save hero data to a blockchain. Your game doesn't need to implement this directly, but you can display blockchain transaction information if it's included in the hero data:

```gdscript
func update_blockchain_info():
    if hero_data and hero_data.has("txHash"):
        $BlockchainLabel.text = "Saved on blockchain: " + hero_data.txHash.substr(0, 10) + "..."
        $BlockchainLabel.visible = true
    else:
        $BlockchainLabel.visible = false
```

### Points System

The Arcadia platform uses a points system (PNTs) that can be earned in games:

```gdscript
func award_points(amount):
    if hero_data:
        hero_data.points += amount
        $PointsLabel.text = "Points: " + str(hero_data.points)
        
        # Show notification
        $PointsNotification.text = "+" + str(amount) + " PNTs!"
        $PointsNotification.visible = true
        yield(get_tree().create_timer(2.0), "timeout")
        $PointsNotification.visible = false
```

## Contact

For any questions or issues with the integration, please contact the Arcadia development team. 