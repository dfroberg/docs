# This is some info
[TOC]

# Code Blocks
`Some code`

~~~bash
#!/bin/bash
echo "Hello World!"
~~~

```ruby
def foo
    puts 'bar'
end
```
# Some Charts
@startuml
class Object << general >>
Object <|--- ArrayList

note top of Object : In java, every class\nextends this one.

note "This is a floating note" as N1
note "This note is connected\nto several objects." as N2
Object .. N2
N2 .. ArrayList

class Foo
note left: On last defined class
@enduml
---
@startuml
abstract        abstract
abstract class  "abstract class"
annotation      annotation
circle          circle
()              circle_short_form
class           class
diamond         diamond
<>              diamond_short_form
entity          entity
enum            enum
interface       interface
@enduml
---
@startuml
You -> Wiki: View Request
Wiki --> Test: Redirect
Test -> Login: Authentication Request
You <-- Login: another authentication Response
@enduml
---
@startuml
Alice -> Bob: Authentication Request
Bob --> Alice: Authentication Response
Alice -> Bob: Another authentication Request
Alice <-- Bob: another authentication Response
@enduml

# WFDB Record

> **Date:** Tue 10 Mar 2020 06:15:25 AM UTC
> 
> **Summary:** Overview of the Waveform Database (WFDB) record format
>
> **Keywords:** ##summary #wfdb #dataformat #storage #healthcare #opensource #standard 

## **Note Linked To:**

### [The Technology Index](03162020223918-technology-index)
- **Summary:** This index is a compilation of utilities and resources when working with any sort of technology.

---

## **Overview:**

The Waveform Database (WFDB) Library is a record management system to handle already existing databases - it itself is not a database but a collection of tools to handle databases that follow the WFDB format. [@moodyWFDBProgrammerGuide2019] Furthermore, WFDB can be used for viewing, analyzing, and creating recordings of physiological signals [@garciamartinezLoadingPlottingFiltering2017].

## **How It Works:**

The way that the WFDB record format works is that it utilizes [@moodyWFDBProgrammerGuide2019]:

- **Header Files** to specify the characteristics of a signal (sampling frequency, etc.)
- **Annotation Files** to record annotations corresponding to a signal (generally kept in time with the rest of the signal)

## **Example Application - ECG Data:**

For example, when working with ECG data, the format utilizes the header and annotation files as follows [@moodyWFDBProgrammerGuide2019]:

- **Header Files** - could contain information about lead count, calibration format, etc.
- **Annotation Files** - could contain other information such as beat positions.

## **Miscellaneous Notes:**

- WFDB is considered a standard data format within the research world, and has found application in industry as well.
- The WFDB format is generally used for ECG records - however, it can extend to other data formats.
- A possible alternative to the WFDB record format is the European Data Format+ (EDF+) [@garciamartinezLoadingPlottingFiltering2017].

### **References:** 