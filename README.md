# TrackMotion

## Table of Contents

1. [Introduction](#introduction)
2. [Key Features](#key-features)
3. [Requirements](#requirements)
   - [Functional Requirements](#functional-requirements)
   - [Non-Functional Requirements](#non-functional-requirements)
   - [Software and Library Requirements](#software-and-library-requirements)
4. [Setup Guide](#setup-guide)
5. [Technologies Used](#technologies-used)
6. [Software Architecture](#software-architecture)
7. [Task Declaration in the Manifest](#task-declaration-in-the-manifest)
8. [Compatibility and Recommendations](#compatibility-and-recommendations)
9. [Contributions](#contributions)
10. [Contact](#contact)
11. [License](#license)

---

## Introduction

TrackMotion is an advanced framework for monitoring and analyzing individual motor activities, developed with a scalable and modular architecture. The integration of inertial sensors and GPS enables continuous data collection with high precision, while sophisticated processing algorithms allow for the extraction of significant patterns related to the user's mobility habits.

---

## Key Features

- **Real-time kinematic monitoring**: Implementation of pipelines for continuous data collection and analysis from motion sensors.
- **Asynchronous data persistence**: Storage architecture based on AsyncStorage to ensure efficient data management with fast access.
- **Advanced historical analysis**: Implementation of visualization modules with interactive graphical representations to facilitate trend evaluation over time.
- **Geolocation management**: Geofence module for automatic detection of entry and exit from defined areas of interest.
- **Energy efficiency optimization**: Advanced algorithms to reduce battery consumption, based on dynamic wake locks and adaptive monitoring.
- **Extended compatibility**: Support for mobile architectures starting from Android 8.0 with interfaces compatible with the latest system APIs.

---

## Requirements

### Functional Requirements
1. The user can start/stop tracking an activity (walking, sitting, driving).
2. The application records the time spent on each activity and stores data locally.
3. The user can view past activities in a list or calendar format.
4. The application provides graphical reports to visualize activity trends.
5. The system sends periodic notifications to remind the user to track activities or encourage movement.
6. Automatic background tracking of physical activity using Android sensors.
7. Step counting functionality for walking activities.

### Non-Functional Requirements
1. **Performance**: The application must be responsive and consume limited system resources (CPU, battery).
2. **Security**: User data must be stored securely and accessible only by the user.
3. **Portability**: The application must be compatible with Android devices from version 8.0 onwards.
4. **Scalability**: The architecture should allow future extensions, such as the integration of new activity types or additional features.

### Software and Library Requirements
To run TrackMotion, ensure that the following dependencies and environments are set up:

- **Node.js** (version 14 or later)
- **Expo CLI** (`npm install -g expo-cli`)
- **React Native** (`npm install react-native`)
- **TypeScript** (`npm install -g typescript`)
- **All necessary Expo libraries** can be installed with a single command:
  ```bash
  npx expo install
  ```

---

## Setup Guide

Follow these steps to set up and use TrackMotion:

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/TrackMotion.git
cd TrackMotion
```

### 2. Install Dependencies
Ensure you have **Node.js** and **Expo CLI** installed. Then run:
```bash
npm install
```
If you are missing any Expo dependencies, run:
```bash
npx expo install
```
This will install all required Expo libraries.

### 3. Configure Environment Variables
Create a `.env` file in the root directory and define necessary configurations such as API keys, database paths, or notification settings.

### 4. Run the Application
Start the development server with Expo:
```bash
expo start
```
You can then test the app on an Android emulator, iOS simulator, or a real device using the Expo Go app.

### 5. Build for Production
To generate a production-ready APK or IPA file, use:
```bash
eas build --platform android  # For Android
eas build --platform ios      # For iOS
```

---

## Technologies Used

TrackMotion leverages a highly optimized set of technologies to ensure high reliability and computational performance:

- **Language**: TypeScript for enhanced robustness and code integrity.
- **Framework**: React Native with Expo, for high-performance cross-platform development.
- **State Management**: Context API for optimizing application reactivity.
- **Data Persistence**: AsyncStorage, with advanced JSON serialization strategies.
- **Notifications and Scheduling**: Implementation with Expo Notifications for asynchronous alert management.
- **Geolocation and Sensor Integration**: Use of Expo Location and acceleration sensors for advanced kinematic tracking.
- **Data Visualization**: Advanced visualization libraries for generating statistical reports.

---

## Software Architecture

The TrackMotion architecture is structured into **three fundamental levels**:

1. **Presentation (UI/UX)**: Layer responsible for user interaction with optimized interfaces for responsiveness and accessibility.
2. **Application Logic**: Intermediate module that governs data flow and manages the application's business logic.
3. **Data Management**: Persistent storage structure, with caching strategies and optimization of read and write accesses.

---

## Task Declaration in the Manifest

To ensure proper background operation on **Android**, background tasks must be declared in the **AndroidManifest.xml** file.
Below is an example declaration:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.trackmotion">

    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

    <service android:name="expo.modules.taskManager.TaskService" 
        android:permission="android.permission.BIND_JOB_SERVICE" 
        android:exported="false" />
</manifest>
```

Tasks defined in the application, such as `BACKGROUND_TRACKING_TASK` and `GEOFENCE_MONITORING_TASK`, must be configured to operate in the background following **Expo TaskManager** guidelines.

On **iOS**, background support requires the declaration of **location updates** capabilities within the `Info.plist` file:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
    <string>fetch</string>
</array>
```

---

## Compatibility and Recommendations

TrackMotion has been extensively tested on **Android**, ensuring proper functionality of background tracking features. 

On **iOS**, background operation support may require additional configurations and optimizations depending on battery management and system permissions.

---

## Contributions

TrackMotion follows an open-source development policy and encourages academic and industrial contributions. Procedure for contributors:

1. **Fork the repository**.
2. **Create a dedicated branch** for your feature or patch.
3. **Validate the code through automated tests**.
4. **Submit a pull request** with detailed documentation of changes.

---

## Contact

For collaboration requests and further information:

- **Author**: Thomas Westerman  
- 🔗 **LinkedIn**: [LinkedIn Profile](https://www.linkedin.com/in/thomaswesterman)  

---

## License

TrackMotion is distributed under the **MIT** license. Refer to the `LICENSE` file for details on terms of use.

