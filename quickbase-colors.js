
(function() {
    function getWeekNumber(d) {
        // Copy date so don't modify original
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        // Get first day of year
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        // Calculate full weeks to nearest Thursday
        var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
        // Return array of year and week number
        return [d.getUTCFullYear(), weekNo];
    }

    function getWeekId(d) {
        let [year, week] = getWeekNumber(d)
        return [String(year).padLeft(4, '0'), String(week).padLeft(2, '0')].join('.')
    }
    
    function addDays(date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
      

    table = document.querySelector("table[role='grid']")

    headers =  Array.from(table.querySelectorAll("thead tr:first-child th"))
    headers = headers.map(header => header.innerText.trim())
    
    cells =  Array.from(table.querySelectorAll("table[role='grid'] tbody td"))
    
    cells.forEach(cell => {
        let value = cell.innerText
        let children = Array.from(cell.parentNode.childNodes)
        let index = children.indexOf(cell)
        let header = headers[index]

        let validHeaderPattern = /((\d\d\d)|(QA\d)) \((Revised|Actual) Finish\)$/
        let match = header.match(validHeaderPattern)

        if(match === null || match === undefined) return

        let isActualFinish = match[4] === 'Actual'

        if(!isActualFinish) return
        if(value !== '') return

        let revisedFinishValue = cell.previousSibling.innerText

        let dateComponents = revisedFinishValue.match(/(\d\d)-(\d\d)-(\d\d)/)
        if(dateComponents === null || dateComponents === undefined) return



        let revisedFinishDate = new Date(
            2000 + parseInt(dateComponents[3]),
            parseInt(dateComponents[1]) - 1,
            parseInt(dateComponents[2]),
        )

        

        let now = new Date()
        let thisWeek = getWeekId(now)
        let nextWeek = getWeekId(addDays(now, 7))

        let revisedFinishWeek = getWeekId(revisedFinishDate)

        const yellow = "#fff2cc"
        const red = "#f4cccc"
        const green = "#d9ead3"

        if(revisedFinishWeek === thisWeek) {
            cell.style.backgroundColor = yellow
            cell.previousSibling.style.backgroundColor = yellow
        } else if(revisedFinishWeek < thisWeek) {
            cell.style.backgroundColor = red
            cell.previousSibling.style.backgroundColor = red
        } else if(revisedFinishWeek === nextWeek) {
            cell.style.backgroundColor = green
            cell.previousSibling.style.backgroundColor = green
        }

        console.log(index, header, value, revisedFinishValue, revisedFinishDate, getWeekId(revisedFinishDate))
    })
})()

