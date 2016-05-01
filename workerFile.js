/**
 * Created by John Koehn on 4/30/2016.
 */
self.addEventListener('message', function(cycler)
{
    //set winning color
    if(cycler.counter == cycler.numCycles)
    {
        cycler.counter = 0;
        clearInterval(cycler.interval);
        if(cycler.winner < 8)
            $('#colorTest').css('fill', '#E60000');
        else if(cycler.winner == 15)
            $('#colorTest').css('fill', 'GREEN');
        else
            $('#colorTest').css('fill', 'BLACK');

        colorCyclerWorker.terminate();
        return;
    }

    //general case, cycle for a while.
    if($('#colorTest').css('fill') == 'rgb(230, 0, 0)')
    {
        $('#colorTest').css('fill', 'GREEN');
    }
    else if($('#colorTest').css('fill') == 'rgb(0, 128, 0)')
    {
        $('#colorTest').css('fill', 'BLACK');
    }
    else if($('#colorTest').css('fill') == 'rgb(0, 0, 0)')
    {
        $('#colorTest').css('fill', '#e60000');
    }
    else
    {
        console.log('error');
    }
    ++cycler.counter;
    setTimeout("changeColor()", cycler.counter * 10);
});