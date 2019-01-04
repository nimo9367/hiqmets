import { countdown } from '../main';
class Challange {
    id: string = '';
    name: string = '';
    description: string = '';
    startdate: Date = new Date();
    enddate: Date = new Date();
    countDownStr: string = '';

    public status()
    {
        const now = new Date();
        if(now > this.enddate)
            return 'ended';
        
        if (now > this.startdate && now < this.enddate)
            return 'started';
        
        return 'notstarted';
    }
    
    public countDown() {
        const self = this;
        setInterval(function(){
           const status = self.status();
            if(status === 'ended')
                self.countDownStr = 'Avslutad';
            else if (status === 'started')
                self.countDownStr = 'Slutar om: ' + countdown(self.enddate).toString();
            else 
                self.countDownStr = 'Börjar om: ' + countdown(self.startdate).toString();
        }, 1000);
    }
}
export default Challange;