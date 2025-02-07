# wordgriddle
Grid based word puzzle game

# Structure
* Webserver written with node.js and express with a database
* Express routes configured for static web pages and a web API
* Static web pages served from ```public``` folder
* Web pages following responsive web design for use on phone, tablet or PC
* Web API provided for access to puzzles for design and for play
* Web API also provides APIs for system administration
* Puzzle design capabilities allow text file import/export of puzzles to allow transfer and archive
* Puzzle design is backed by a fixed dictionary, and editable excluded and bonus word lists
* Each puzzle, in database and on export, is self contained with full word list information

# Development
* GitHub (code repo, issues, releases, ...)
* VS Code
* node.js (version 10/11)
* node packages:
  * express
  * sqlite (initially, consider something more robust later)
  * passport.js (user management)
  * nodemon -- installed globally (development assistance, restart server on change)
  * pm2 -- installed globally (runs app in background as a service)
## Development repositories
* [wordgriddle](https://github.com/Motivesoft/wordgriddle)
  * Intended to be the production repo
  * Slowly developed with ideas/collateral from other repositories
* [wordgriddle-server](https://github.com/Motivesoft/wordgriddle-server)
  * Initial proof of concept (pre-alpha)
  * Working client/server for playing puzzles
  * Minimal other features, just enough to firm up some ideas
  * Mostly for play testing and usability work for the word grid itself
* [wordgriddle-utilities](https://github.com/Motivesoft/wordgriddle-utilities)
  * Command line tools
    * grid creation
    * word search/puzzle solving
    * word list segregation
  * Elements of this will go into the puzzle design capabilities
* [wordgriddle-puzzle-designer](https://github.com/Motivesoft/wordgriddle-puzzle-designer)
  * Web API endpoints for things related to puzzle design
    * Word lists 
      * Bonus and excluded lists need management capabilities
      * Maintenance (CRUD - create, read, update, delete)
      * Backup/restore to file

# Instructions
## Deployment
* Install node
* ```npm install```
* ```npm install -g nodemon``` (deveoper system)
* ```npm install -g pm2```     (production system)
* ```pm2 start server.js```

## Development
* Install node
* ```npm install```
* ```npm install -g nodemon``` (deveoper system)
* ```npm version prerelease``` (or other value, incremement version info at key points)

# Development phases
* Concepts / Prototypes
  * Proof of concept (see [Development repositories](#development-repositories))
    * Basic web services
    * Playable UI
    * Backend database/files
    * Controlled set of test puzzles
    * Puzzle designer ideas and building blocks
  * UI prototyping for device support 
  * Newly created puzzles/word lists
  * Planning subsequent phases
* Structured, starting with [0.1](#version-01-development-version)
* Roadmapping
* Feature complete first version
* Testing
* Maintenance

# Planned phases
## Version 0.0 (scaffolding)
### Must
* Repo [wordgriddle](https://github.com/Motivesoft/wordgriddle)
* Basic stack (node, express, sqlite)
* Server with routes and static HTML
* General project structure
* Select ideas from prototypes

## Version 0.1 (development version)
### Must
* Playable at home (i.e. self-hosted, no securty/access control)
* Allow creation of puzzles, although not necessarily glamourous
  * Includes basic word list use/management as necessary
* Working puzzle grid
  * Playable, with word lists and completion
  * Demonstrating persistence (save/restore progress)
  * User selectable
  * Some amount of UI responsive design
* Start building puzzle catalog
* Start building word lists
* Solid foundations for backend server
  * code structure
  * version reporting
  * logging practices
  * running in IDE
  * startup/shutdown gracefully 

### Should
* Allow basic maintenance of excluded and bonus word lists
* Develop from branches/issues/PRs
* Have a separate Test server on network
* Word lists committed to repos on update
  * Bonus and excluded both sourced from publishable puzzles
  * Committed with details about sources (puzzles)
  * May be seeded manually by general maintenance

### Could

### Won't
* Have 'guaranteed' retention of player statistics


## Version 0.2 (internal alpha)
### Must
* Develop from branches/issues/PRs
* Deployment instructions for new servers

### Should
* Have database design ideas clear 

## Version 0.3 (limited release alpha)
This version may go to family/friends, as a short alpha phase for feedback

### Must
* Support for multiple users (5?)
  * e.g. sign in, guest accounts (maybe using cookies), hard coded with UI selector, ...
* Basic security and access control based on users/adminitrators
* Launch with only unique, approved puzzles - i.e. signed off by someone other than the creator
* Report version number in UI
* Publicise a support contact email address
* Branding (graphics, naming, colours, ...)

### Should
* A more robust database
* Comprehensive backup/restore routine
* User sign in (rudimentary)
* Remote hosted
* Dark mode

### Could

### Won't
* User registration
* Guaranteed saving of puzzle stats

## Version 0.4-0.7 (other non-public iterations)
Alternating internal and limited release alpha/beta iterations

### Scope
* Choice of database
* Backup/restore procedures, with automation 
* Finalise hosting, URL
* User registration
* Guest accounts

## Version 0.8 (final 'friendly-user' beta, initial public alpha)
### Must
* Have a (small) cache of playable puzzles
* Have an agreed dictionary
* Have meaningful excluded and bonus word lists for published puzzles

### Should
### Could
* CI/CD

## Version .9 (public beta)
### Must
* Be feature complete
* Have a puzzle publication schedule
* Solid user registration features

### Should
* A reasonable selection of puzzles ready to release
* CI/CD

## Version 1.0 (public release)

# Deployment
Multiple servers with essentially the same setup where updates are tested on a test system prior to release and puzzles are developed and tested on an admin system prior to publication

## Example
  * Public - game playing by registered and guest users
  * Admin - for puzzle creation/management/testing/publication
  * Test - for pushing/testing updates prior to release
    * Rebuilt from time to time
    * Test restores on a routine basis
    * Beta test functionality updates/fixes for Public and Admin
    * Beta test new puzzles with limited group
  * Development - used by developer(s) to create updates to push to Test


# Data and database tables
## ```dictionaryWords```
* Sourced from text file, installed via web API

## ```bonusWords```
## ```excludedWords```

# Web API
## Admin
### ```dictionary```
* ```match(word)``` - return ```true``` if ```word``` is in dictionary 
* ```partialMatch(letters)``` - return ```true``` if one or more words in dictionary start with ```letters```
* ```installWords``` - replace dictionary content with provided word list

## Game

## Testing
### bruno
```shell
npm install @usebruno/cli

cd [test folder]
bru run [.bru file] --env [environment name]
```

### curl
```shell
curl -F "file=@../wordgriddle-utilities/data/dictionary.txt" http://localhost:8996/api/dictionary/upload
curl -F "file=@../wordgriddle-utilities/data/bonus.txt" http://localhost:8996/api/bonus/upload
curl -F "file=@../wordgriddle-utilities/data/excluded.txt" http://localhost:8996/api/excluded/upload

curl  http://localhost:8996/api/dictionary/info  
curl  http://localhost:8996/api/bonus/info  
curl  http://localhost:8996/api/excluded/info  

curl  http://localhost:8996/api/dictionary/validate/:word
curl  http://localhost:8996/api/bonus/validate/:word
curl  http://localhost:8996/api/excluded/validate/:word

curl  http://localhost:8996/api/dictionary/validate-prefix/:letters  
curl  http://localhost:8996/api/bonus/validate-prefix/:letters  
curl  http://localhost:8996/api/excluded/validate-prefix/:letters  
```

## Puzzle Page
Layout:
- 4 columns (40% for grid and metadata, 3x20% for word lists)

Button->New puzzle
 - size
 - name
 - author
 - created date

Button->Lock/Unlock
Button->Load
Button->Save  (disabled if puzzle locked)
button->Solve (disabled if puzzle locked)

Button->Make Bonus (Required, Excluded)
Button->Make Excluded (Required Bonus)
Button->Make Required (Bonus, Excluded)
Button->Save Changes (Bonus)
Button->Save Changes (Excluded)

Words only have checkboxes if never saved to a list before???

Concern:
- Words may end up in both bonus and excluded lists. Either:
  1 Ignore this
  1 Try and automate data integrity on update
  1 Provide an API to allow manually invoking a housekeeping method to resolve this
  1 One of the above __AND__ make sure puzzle solver checks excluded list first