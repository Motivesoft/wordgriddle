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

# Planned phases
## Version 0.1 (development version)
### Must
* Playable at home (i.e. self-hosted, no securty/access control)
* Allow creation of puzzles, although not necessarily glamourous
* Demonstrate persistence
* Start building puzzle catalog
* Start building word lists

### Should
* Allow basic maintenance of excluded and bonus word lists
* Develop from branches/issues/PRs
* Have a separate Test server on network

### Could

### Won't
* Have 'guaranteed' retention of player statistics


## Version 0.2 (internal alpha)
### Must
* Develop from branches/issues/PRs

## Version 0.3 (limited release alpha)
This version may go to family/friends, as a short alpha phase for feedback

### Must
* Support for multiple users (5?)
  * e.g. sign in, guest accounts (maybe using cookies), hard coded with UI selector, ...
* Basic security and access control based on users/adminitrators
* Launch with only unique, approved puzzles - i.e. signed off by someone other than the creator
* Report version number in UI
* Publicise a support contact email address

### Should
* A more robust database
* Comprehensive backup/restore routine
* User sign in (rudimentary)
* Remote hosted

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

## Version .8 (final 'friendly-user' beta, initial public alpha)
### Must
* Have a (small) cache of playable puzzles
* Have an agreed dictionary
* Have meaningful excluded and bonus word lists for published puzzles

## Version .9 (public beta)
### Must
* Be feature complete
* Have a puzzle publication schedule
* Solid user registration features

### Should
* A reasonable selection of puzzles ready to release

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
