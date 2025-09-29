package Tatipamula_A02;

import java.util.Random;
import java.util.Scanner;

public class Driver {

	public static void main(String[] args) {
		String playAgain;
		Scanner input = new Scanner(System.in);
		Game game = new Game();
		Session session = new Session();
		
		session.setName();
		session.prtIntro();
		
		
		do {
			session.setTurns();
			session.getTurns();
			System.out.println();
			for(int i = 1; i <= session.getTurns(); i++){
				System.out.println("*** Turn " + i + " ***");
				game.setDice();
				game.sortDice();
				game.getDie1();
				game.getDie2();
				game.getSum();
				game.setPairBonus();
				game.getPairBonus();
				game.setSeven11Bonus();
				game.getSeven11Bonus();
				game.setTotal();
				game.getTotal();
			}
			
			
			
			
		
		
			System.out.println("Would you like to play again? Enter Y or N: ");
			playAgain = input.next();
			if(playAgain == "Y") {
				System.out.println("Enter the number of turns you wish to play: ");
				
			}
		}while(playAgain.toUpperCase().equals("Y"));
		
		session.prtOutro();
	}

	}

class Game{
	private int die1, die2, sum, total, tempDie,maxDie;
	private int seven11Bonus = 0;
	private int pairBonus = 0;
	//Define Constructors
	public void setDice() {
		Random random = new Random();

			die1 = random.nextInt(6) + 1;
			die2 = random.nextInt(6) + 1;
			sum = die1+die2;
			
	}

	public void sortDice() {
		if(die1 > die2) {
			tempDie = Math.min(die1, die2);
			maxDie = Math.max(die1, die2);
			System.out.println("Dice roll: " + tempDie +", " + die1);
		}
		if(die2 > die1) {
			tempDie = Math.min(die1, die2);
			System.out.println("Dice roll: " + tempDie +", " + die2);
		}
		if(die1 == die2) {
			System.out.println("Dice roll: " + die1 + ", " + die2);
		}
	}
	public void getDie1() {
		System.out.println("Die 1: " + die1);
	}
	public void getDie2() {
		System.out.println("Die 2: " + die2);
	}
	public void getSum() {
		System.out.println("Sum: " + sum);
	}
	public void setPairBonus() {
		if(die1 == die2) {
			pairBonus = 6;
		}
		else {
			pairBonus = 0;
		}
	}
		public void getPairBonus() {
			System.out.println("Pair Bonus: " + pairBonus);
		}
		public void setSeven11Bonus() {
			if(sum == 7 || sum == 11) {
				seven11Bonus = 5;
			}
			else {
				seven11Bonus = 0;
			}
		}
		public void getSeven11Bonus() {
			System.out.println("7-11 Bonus: " + seven11Bonus);
		}
		public void setTotal() {
			total = sum + seven11Bonus + pairBonus;
			
		}
		public void getTotal() {
			System.out.println("Total Pts: " + total);
			System.out.println();
		}
	}

class Session{
	Scanner input = new Scanner(System.in);
	Random random = new Random();
	private String name = "";
	private String anycharacter;
	private int turns;
	//Define constructors
	public void setName() {
		System.out.println("Please enter your name: ");
		name = input.nextLine();
	}
	public void prtIntro() {
		System.out.println();
		System.out.println("			   Hi, " + name + ". Welcome to the 3311 Dice Game!");
		System.out.println("	Playing the game is easy - just \"roll\" the dice and the computer does the rest.");
		System.out.println("	  The sum of the dice is worth points. You earn 5 bonus points if you roll a 7 or 11.");
		System.out.println("			  You earn 6 bonus points if you roll doubles.");
		System.out.println("			Now let's begin - enter any character key to begin.");
		anycharacter = input.next();
		System.out.println();
		
	}
	public void setTurns() {
		System.out.print("Enter the number of turns you wish to play: ");
		turns = input.nextInt();
	}
	public int getTurns() {
		return turns;
	}
	public void prtOutro() {
		System.out.println();
		System.out.println("		Thank you for playing 3311 Dice Game, " + name + ".");
		System.out.println("		     Come back and play again any time!");
		
		input.close();
	}
	
	


}
