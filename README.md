# 3-State-Flying-System Module

## Project Overview
### Table of Contents
1. Project Description
2. Feature List
3. Setup

### Project Description
This flying-system has three states: ascend, descend and hover. This project is not a full addon, rather a module that you can add to your existing addon.

#### Feature List

| Number | Feature                                     | Description                                        | 
|--------|---------------------------------------------|----------------------------------------------------|
| 1      | Ascend                        | Tap or hold the jump button to ascend                            |
| 2      | Descend                       | Press nothing to descend                                         |
| 3      | Hover                         | Double-Tap the jump button to hover                              | 

## Setup

1. Download the threeStateFlyingSystem.js script and put it in the scripts folder of your behavior pack
2. Import the module and access the main function via threeStateFlyingSystem.main()
3. Add the entity to the Vehicles class
4. Add the family `helicopter` to the entity's behavior
