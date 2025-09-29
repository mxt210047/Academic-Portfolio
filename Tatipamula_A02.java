package Tatipamula_A02;
import java.util.Scanner;
import java.util.Random;
public class Tatipamula_A02 {

	public static void main(String[] args) {
		String name = "";
		int die1, die2, sum, total, tempDie,maxDie;
		int seven11Bonus = 0;
		int pairBonus = 0;
		String anycharacter;
		Scanner input = new Scanner(System.in);
		
		System.out.println("Please enter your name: ");
		name = input.nextLine();
		System.out.println();
		System.out.println("			   Hi, " + name + ". Welcome to the 3311 Dice Game!");
		System.out.println("	Playing the game is easy - just \"roll\" the dice and the computer does the rest.");
		System.out.println("	  The sum of the dice is worth points. You earn 5 bonus points if you roll a 7 or 11.");
		System.out.println("			  You earn 6 bonus points if you roll doubles.");
		System.out.println("			Now let's begin - enter any character key to begin.");
		anycharacter = input.next();
		Random random = new Random();
		System.out.println();
		
		die1 = random.nextInt(6) + 1;
		die2 = random.nextInt(6) + 1;
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
		
		sum = die1 + die2;
		System.out.println("Dice sum: " + sum);
		if(die1 == die2) {
			pairBonus = 6;
			System.out.println("Pair Bonus: " + pairBonus);
		}
		else {
			System.out.println("Pair Bonus: 0");
		}
		if(sum == 7 || sum == 11) {
			seven11Bonus = 5;
			System.out.println("7-11 Bonus: " + seven11Bonus);
		}
		else {
			System.out.println("7-11 Bonus: 0");
		}
		
		
		total = sum + seven11Bonus + pairBonus;
		System.out.println("Total Pts: " + total);
		System.out.println();
		System.out.println("		Thank you for playing 3311 Dice Game, " + name + ".");
		System.out.println("		     Come back and play again any time!");
		input.close();
	}


}
